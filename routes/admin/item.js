const { Item } = require('../../models/itemModel');
const { Category } = require('../../models/categoryModel');
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const checkValidationResult = require('../../middleware/checkValidationResult');
const mongoose = require('mongoose');
//////////////////////////////////////////
const config = require('config');
const PS = config.get('pageSize');
let pageSize = (Number(PS) && PS > 0) ? PS : 10;
// name limitations
const minMaxLengthOfNames = config.get('limitationsOfNames');

// image path limitations
const minMaxLengthOfPath = config.get('limitationsOfPath');

//////////////////////////////////////////
//The following specific Extra characters can be in a category and item name or search term
const specificExtraCharsForNames = config.get('specificExtraCharsForNames');
const specificExtraCharsForImagePath = config.get('specificExtraCharsForImagePath');

//////////////////////////////////////////
// GET: /api/admin/item/searchCategory/{searchTerm} 

// List all items that their categories have {searchTerm} in their names.
// Returned categories and items can have 'archived' status.

// return value (response):
// { items:
// 	[
// 		{
// 			id:”string”
// 			name:”string”
//          status: ”string”
// 		}
// 	]
// }

router.get('/searchCategory/:search',
    check('search')
        .notEmpty()
        .withMessage('It should be written.')
        .isAlphanumeric('en-US', { ignore: specificExtraCharsForNames })
        .withMessage(`It should be filled by just alphabets and characters or ${specificExtraCharsForNames}`)
    , checkValidationResult

    , async (req, res) => {

        let sellectedItems = [];

        const st = ".*" + req.params.search + ".*";
        var searchTearm = new RegExp(st, 'i');

        const selectedCategoryIds = await Category
            .find({ name: { $regex: searchTearm } })
            .select({ _id: 1, name: 1, status: 1 });

        if (selectedCategoryIds.length == 0)
            return res.status(404).send({ error:'Can not find any category related to the searchTerm.'});

        let arrayOfCategoryObjectIds = [];
        for (let i = 0; i < selectedCategoryIds.length; i++)
            //it is possible to exclude archived categories from this search
            //if (selectedCategoryIds[i].status != 'archived') {
            arrayOfCategoryObjectIds.push(selectedCategoryIds[i]._id);
        //}

        sellectedItems = await Item
            .find({
                categoryIds: { $in: arrayOfCategoryObjectIds }
                //it is possible to exclude archived items from this search
                //,status : { $nin: ['archived']}
            })
            .sort({ name: 1 })
            .select({ _id: 1, name: 1, status: 1 });

        if (sellectedItems.length == 0)
            return res.status(404).send({ error:'Can not find any item related to the found categories.'});

        res.send({
            'items': sellectedItems
        });
    });

//////////////////////////////////////////
// GET: /api/admin/item/getCategories/{itemId}
//
// Returns names, ids and status of all categories of an specific item.
// Returned categories can be archived.
//
// return value (response):
// { 
//    categories:
//     [
//         {
//             id:”string”
//             name:”string”
//             status: ”string”
//         }
//     ]
// }

router.get('/getCategories/:id',
    check('id')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , checkValidationResult

    , async (req, res) => {

        let item = await Item.findById(req.params.id);
        if (!item) return res.status(404).send({ error: 'The item with the given ID was not found.' });

        let result = [];
        for (let i = 0; i < item.categoryIds.length; i++) {
            //archived categories will be retrived by this search.
            let category = await Category.findById(item.categoryIds[i]);
            if (!category) return res.status(404).send({ error: `The category with the ID ${item.categoryIds[i]} that is saved as one of categories of this item was not found.` });
            result.push({
                _id: category.id,
                name: category.name,
                status: category.status
            });
        }
        res.send({ 'categories': result });
    });

//////////////////////////////////////////
//POST: /api/admin/item
// Body of request:
// {
// 	name:”string”,
// 	image:”string”
// }
router.post('/',
    check('name')
        .isLength(minMaxLengthOfNames)
        .withMessage(`min and max length of a name should be fit to ${minMaxLengthOfNames.min} and ${minMaxLengthOfNames.max}`)
        .isAlphanumeric('en-US', { ignore: specificExtraCharsForNames })
        .withMessage(`It should be filled by just alphabets and characters or ${specificExtraCharsForNames}`)
    , check('image')
        .notEmpty()
        .withMessage('It should be written.')
        .isLength(minMaxLengthOfPath)
        .withMessage(`min and max length of a path should be fit to ${minMaxLengthOfPath.min} and ${minMaxLengthOfPath.max}`)
        .isAlphanumeric('en-US', { ignore: specificExtraCharsForImagePath })
        .withMessage(`It should be filled by just alphabets and characters or ${specificExtraCharsForImagePath}`)
    , checkValidationResult

    , async (req, res) => {

        let item = await Item.findOne({ name: req.body.name });
        if (item) return res.status(404).send(  { error:`The item with the given name was found among the items in the DB. You can not add it again. item: ${item}`});

        item = new Item({ name: req.body.name, image: req.body.image });

        item = await item.save();

        res.send(item);
    });

//////////////////////////////////////////
//PUT: /api/admin/item/rename
// Body of request:
// {
// 	id:”string”
// 	name:”string”
// }
router.put('/rename/',
    check('id')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , check('name')
        .isLength(minMaxLengthOfNames)
        .withMessage(`min and max length of a name should be fit to ${minMaxLengthOfNames.min} and ${minMaxLengthOfNames.max}`)
        .isAlphanumeric('en-US', { ignore: specificExtraCharsForNames })
        .withMessage(`It should be filled by just alphabets and characters or ${specificExtraCharsForNames}`)

    , checkValidationResult
    , async (req, res) => {

        //archived categories can not be renamed
        let item = await Item.findOneAndUpdate(
            { _id: req.body.id, status: { $nin: ['archived'] } },
            {
                $set: {
                    name: req.body.name
                }
            }, { new: true });

        if (!item) return res.status(404).send({ error: 'The item with the given ID was not found.' });
        res.send(item);
    });
//////////////////////////////////////////
//  PUT: /api/admin/item/changeImage
// Body of request:
// {
// 	id:”string”
// 	image:”string”
// }
router.put('/changeImage/',
    check('id')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , check('image')
        .notEmpty()
        .withMessage('It should be written.')
        .isLength(minMaxLengthOfPath)
        .withMessage(`min and max length of a path should be fit to ${minMaxLengthOfPath.min} and ${minMaxLengthOfPath.max}`)
        .isAlphanumeric('en-US', { ignore: specificExtraCharsForImagePath })
        .withMessage(`It should be filled by just alphabets and characters or ${specificExtraCharsForImagePath}`)
    , checkValidationResult

    , async (req, res) => {

        let item = await Item.findOneAndUpdate(
            { _id: req.body.id, status: { $nin: ['archived'] } },
            {
                $set: {
                    image: req.body.image
                }
            }, { new: true });

        if (!item) return res.status(404).send({ error: 'The item with the given ID was not found.' });

        res.send(item);
    });

//////////////////////////////////////////    ?
// PUT: /api/admin/item/addCategory
// {
//     id:”string”   //item id 
//     categoryId:”string”
// }

router.put('/addCategory/',
    check('id')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , check('categoryId')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , checkValidationResult
    , async (req, res) => {

        // Check to find the item
        let item = await Item.findOne({ _id: req.body.id, status: { $nin: ['archived'] } });
        if (!item) return res.status(404).send({ error: 'An item with the given ID was not found.' });

        // Is the category Id  available ? or is it valid? or is it active?
        let category = await Category
            .findOne({ _id: req.body.categoryId });
        if (!category) return res.status(404).send({ error:'The category with the given ID was not found.' });
        if (category.status === 'deactivate') return res.status(404).send({ error: 'The category with the given ID is deactivate now. It can not be added to the item.' });
        if (category.status === 'archived') return res.status(404).send({ error: 'The category with the given ID is archived now. It can not be added to the item.' });

        // check to see if the category id that is going to be inserted
        //   is one of the item's category id in advance
        const indexOfObject = item.categoryIds.indexOf(category.id);
        if (indexOfObject != -1)
            return res.status(404).send({ error: 'The category with the given ID is one of the category id s of the given item.' });

        //item.categoryIds[item.categoryIds.length] = req.body.categoryId;
        item.categoryIds.push(req.body.categoryId);
        item = await item.save();

        res.send(item);
    });
//////////////////////////////////////////  ?  
// PUT: /api/admin/item/removeCategory
// {
//     id:”string”    //itemId
//     categoryId:”string”
// }

router.put('/removeCategory/',
    check('id')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , check('categoryId')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , checkValidationResult

    , async (req, res) => {

        // Check to find the item
        let item = await Item.findOne({ _id: req.body.id, status: { $nin: ['archived'] } });
        if (!item) return res.status(404).send({ error: 'An item with the given ID was not found.' });

        // check to see if the category id that is going to be deleted
        //   is one of the item's category id 

        const indexOfObject = item.categoryIds.indexOf(req.body.categoryId);
        if (indexOfObject != -1)
            item.categoryIds.splice(indexOfObject, 1);
        else
            return res.status(404).send({ error: 'The given category ID was not found as one of the category ID s of the item.' });

        item = await item.save();

        res.send(item);
    });
//////////////////////////////////////////    
// PUT: /api/admin/item/activate
// {
//     id:”string”
// }
router.put('/activate/',
    check('id')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , checkValidationResult

    , async (req, res) => {

        let item = await Item.findOneAndUpdate(
            { _id: req.body.id, status: { $nin: ['archived'] } },
            {
                $set: {
                    status: 'activate'
                }
            }, { new: true });

        if (!item) return res.status(404).send({ error: 'The item with the given ID was not found.' });

        res.send(item);
    });
//////////////////////////////////////////
// PUT: /api/admin/item/deactivate
// {
//     id:”string”
// }
router.put('/deactivate/',
    check('id')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , checkValidationResult

    , async (req, res) => {

        let item = await Item.findOneAndUpdate(
            { _id: req.body.id, status: { $nin: ['archived'] } },
            {
                $set: {
                    status: 'deactivate'
                }
            }, { new: true });


        if (!item) return res.status(404).send({ error: 'The item with the given ID was not found.' });

        res.send(item);
    });
//////////////////////////////////////////
// instead of DELETE item the following function is used:
// PUT: /api/admin/item/archived
// {
//     id:”string”
// }
router.put('/archived/',
    check('id')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , checkValidationResult

    , async (req, res) => {

        // Check to find the Item and archive it
        let item = await Item.findOneAndUpdate(
            { _id: req.body.id },
            {
                $set: {
                    status: 'archived'
                }
            }, { new: true });

        if (!item) return res.status(404).send({ error: 'An item with the given ID was not found.' });

        res.send(item);
    });
module.exports = router;