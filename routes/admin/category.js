const { Category } = require('../../models/categoryModel');
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const checkValidationResult = require('../../middleware/checkValidationResult');

//////////////////////////////////////////
const config = require('config');
const PS = config.get('pageSize');
let pageSize = (Number(PS) && PS > 0) ? PS : 10;
// name limitations
const minMaxLengthOfNames = config.get('limitationsOfNames');

//////////////////////////////////////////
//The following specific Extra characters can be in a category name or search term
const specificExtraCharsForNames = config.get('specificExtraCharsForNames');

//////////////////////////////////////////
// GET: /api/admin/category?page={pageNo}&count={ItemCount}&search={SearchTerm}
// returns some categories related to the parameters.
// It also returns 'archived' categories
// return value (response):
// {
// 	totalCount:int,
// 	pageCount:int,
// 	pageNo:int,
// 	lastPage:true,
// 	items:[
// 		{
// 			id:”string”,
// 			name:”string”
// 		}
// 	] 
// }
router.get('/',
    check(['page', 'count'])
        .notEmpty()
        .withMessage('It should be written.')
        .isInt({ min: 1 })
        .withMessage('It should be a positive number, greater than zero.')
    , check('search')
        .notEmpty()
        .withMessage('It should be written.')
        .isAlphanumeric('en-US', { ignore: specificExtraCharsForNames })
        .withMessage(`It should be filled by just alphabets and characters or ${specificExtraCharsForNames}`)
    , checkValidationResult

    , async (req, res) => {

        let sellectedCategories = [];
        let lastPage = false;
        pageSize = Number(req.query.count);
        const pageNumber = Number(req.query.page);

        const st = ".*" + req.query.search + ".*";
        var searchTearm = new RegExp(st, 'i');

        const lowBand = (pageNumber - 1) * pageSize + 1;

        const numAllCategories = await Category
            .find({ name: { $regex: searchTearm } })
            //To exclude 'archived' categories, uncomment the following line
            //.and({ status: { $nin: ['archived'] } })
            .countDocuments();

        if (numAllCategories == 0)
            return res.status(404).send({ error:'There is not any categories related to the search term.'});

        let pageCount = Math.floor(numAllCategories / pageSize);
        if ((numAllCategories % pageSize) > 0)
            pageCount++;

        if (pageNumber > pageCount) {
            return res.status(404).send({ error: `PageNumber (${pageNumber}) is greeter than number of all pages (${pageCount}).` });
        }
        else if (pageNumber == pageCount) {
            lastPage = true;
        }

        sellectedCategories = await Category
            .find({ name: { $regex: searchTearm } })
            //To exclude 'archived' categories, uncomment the following line
            //.and({ status: { $nin: ['archived'] } })
            .skip(lowBand - 1)
            .limit(pageSize)
            .sort({ name: 1 })
            .select('_id name status');

        res.send({
            'totalCount': numAllCategories,
            'pageCount': pageCount,
            'page': pageNumber,
            'lastPage': lastPage,
            'items': sellectedCategories
        });
    });


//////////////////////////////////////////
//POST: /api/admin/category
// Body of request:
// {
// 	name:”string”
// }
router.post('/',
    check('name')
        .isLength(minMaxLengthOfNames)
        .withMessage(`min and max length of a name should be fit to ${minMaxLengthOfNames.min} and ${minMaxLengthOfNames.max}`)
        .isAlphanumeric('en-US', { ignore: specificExtraCharsForNames })
        .withMessage(`It should be filled by just alphabets and characters or ${specificExtraCharsForNames}`)
    , checkValidationResult
    , async (req, res) => {
        let category = await Category.findOne({ name: req.body.name });
        if (category)
            return res.status(404).send({ error:'The category name was in DB in advane.'});
        category = new Category({ name: req.body.name });
        category = await category.save();

        res.send(category);
    });
//////////////////////////////////////////
//  PUT: /api/admin/category/rename
// Body of request:
//  {
// 	    id:”string”
// 	    name:”string”
//  }
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

        let category = await Category.findOneAndUpdate(
            { _id: req.body.id, status: { $nin: ['archived'] } },
            {
                $set: {
                    name: req.body.name
                }
            }, { new: true });

        if (!category) return res.status(404).send({ error: 'The category with the given ID was not found.' });

        res.send(category);
    });
//////////////////////////////////////////
//  PUT: /api/admin/category/activate
// Body of request:
//  {
// 	    id:”string”
//  }
router.put('/activate/',
    check('id')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , checkValidationResult
    , async (req, res) => {

        let category = await Category.findOneAndUpdate(
            { _id: req.body.id, status: { $nin: ['archived'] } },
            {
                $set: {
                    status: 'activate'
                }
            }, { new: true });

        if (!category) return res.status(404).send({ error:'The category with the given ID was not found.' });

        res.send(category);
    });
//////////////////////////////////////////
//  PUT: /api/admin/category/deactivate
// Body of request:
//  {
// 	    id:”string”
//  }
router.put('/deactivate/',
    check('id')
        .notEmpty()
        .withMessage('It should be written')
        .isMongoId()
        .withMessage('It should be a MongoDB objectId')
    , checkValidationResult
    , async (req, res) => {

        let category = await Category.findOneAndUpdate(
            { _id: req.body.id, status: { $nin: ['archived'] } },
            {
                $set: {
                    status: 'deactivate'
                }
            }, { new: true });

        if (!category) return res.status(404).send({ error: 'The category with the given ID was not found.' });

        res.send(category);
    });
//////////////////////////////////////////
// instead of DELETE category the following function is used:
// PUT: /api/admin/category/archived
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

        // Check to find the category and archive it
        let category = await Category.findOneAndUpdate(
            { _id: req.body.id },
            //{ _id: req.body.id, status: { $nin: ['archived'] } },
            {
                $set: {
                    status: 'archived'
                }
            }, { new: true });

        if (!category) return res.status(404).send({ error: 'An item with the given ID was not found.' });

        res.send(category);
    });
module.exports = router;