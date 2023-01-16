const { Item } = require('../models/itemModel');
const { Category } = require('../models/categoryModel');
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const checkValidationResult = require('../middleware/checkValidationResult');

//////////////////////////////////////////
const config = require('config');
const PS = config.get('pageSize');
let pageSize = (Number(PS) && PS > 0) ? PS : 10;

//////////////////////////////////////////
//The following specific characters can be in a category name or search term
const specificExtraCharsForNames = config.get('specificExtraCharsForNames');

//////////////////////////////////////////
//GET: /api/admin/items?page={pageNo}&count={ItemCount}&search={SearchTerm}&category={category}
// return value (response):
// {
//      totalCount:int,
//      pageCount:int,
//      page:int,
//      lastPage:true,
//      items:  [
// 	                {
// 		                id:”string”,
// 		                name:”string”,
// 		                image:”string”
// 	                }
//              ] 
// }
router.get('/items/',
    check(['page', 'count'])
        .notEmpty()
        .withMessage('It should be written.')
        .isInt({ min: 1 })
        .withMessage('It should be a positive number, greater than zero.')
    , check(['search', 'category'])
        .notEmpty()
        .withMessage('It should be written.')
        .isAlphanumeric('en-US', { ignore: specificExtraCharsForNames })
        .withMessage(`It should be filled by just alphabets and characters or ${specificExtraCharsForNames}`)
    , checkValidationResult
    , async (req, res) => {

        let sellectedItems = [];
        let lastPage = false;
        pageSize = Number(req.query.count);
        const pageNumber = Number(req.query.page);
        const categoryName = req.query.category;
        const st = ".*" + req.query.search + ".*";
        var searchTearm = new RegExp(st, 'i');


        const lowBand = (pageNumber - 1) * pageSize + 1;

        const category = await Category.findOne({ name: categoryName })
        .and({status :{ $nin: [ 'archived'] }});

        if (!category)
            res.status(404).send({ error:'Category name is undefined.'});

        const numAllItems = await Item
            .find({ categoryIds: category._id, name: { $regex: searchTearm } })
            .and({ status: { $nin: ['archived'] } })
            .countDocuments();

        if (numAllItems == 0)
            res.status(404).send({ error:`could not find any item in the category of ${categoryName}.`});

        let pageCount = Math.floor(numAllItems / pageSize);
        if ((numAllItems % pageSize) > 0)
            pageCount++;

        if (pageNumber > pageCount && pageCount != 0) {
            return res.status(404).send({ error: `PageNumber (${pageNumber}) is greeter than count of all pages (${pageCount}).` });
        }
        else if (pageNumber == pageCount || pageCount == 0) {
            lastPage = true;
        }

        sellectedItems = await Item
            .find({ categoryIds: category._id, name: { $regex: searchTearm } })
            .and({ status: { $nin: ['archived'] } })
            .skip(lowBand - 1)
            .limit(pageSize)
            .sort({ name: 1 })
            .select('_id name image');

        res.send({
            'totalCount': numAllItems,
            'pageCount': pageCount,
            'page': pageNumber,
            'lastPage': lastPage,
            'items': sellectedItems
        });
    });

module.exports = router;