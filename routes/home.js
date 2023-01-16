
const { Item } = require('../models/itemModel');
const { Category } = require('../models/categoryModel');
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const checkValidationResult = require('../middleware/checkValidationResult');

//////////////////////////////////////////
//In each page 'pageSize' items will be show on screen.
// It is saved in config folder, default.json file.
const config = require('config');
const PS = config.get('pageSize');
const pageSize = (Number(PS) && PS > 0) ? PS : 10;

//////////////////////////////////////////
//GET: /api/home/{page}
// return value (response):
// {
// 	lastPage:true
// 	items:[
// 		{
// 			id:”string”
// 			name:”string”
// 			image:”string”
// 		}
// 	],
// 	categories:[
// 		{
// 			id:”string”,
// 			name:”string”
// 		}
// 	]  
// }

router.get('/:page',
    check('page')
        .isInt({ min: 1 })
        .withMessage('It should be a positive number, greater than zero.')
    , checkValidationResult
    , async (req, res) => {

        let lastPage = false;
        let sellectedItems = [];
        let allCategories = [];

        const pageNumber = req.params.page;

        const lowBand = (pageNumber - 1) * pageSize + 1;
        const highBand = lowBand + pageSize - 1;

        const numAllItems = await Item
            .find({ status: 'activate' })
            .countDocuments();

        let numberOfAllPages = Math.floor(numAllItems / pageSize);
        if ((numAllItems % pageSize) > 0)
            numberOfAllPages++;

        if ((numAllItems > 0) && (pageNumber > numberOfAllPages))
            return res.status(404).send({ error:`Out of range page number:  + ${pageNumber}`});

        //All Categories to send to client
        allCategories = await Category
            .find({ status: 'activate' })
            .sort('name')
            .select('_id name');

             // if DB is empty of both of activate categories and items
        if (numAllItems == 0 && allCategories.length == 0)
            return res.status(404).send({ error:'DB is Empty of activate categories and items'});

        if (highBand >= numAllItems) {
            lastPage = true;
            numInItems = numAllItems - lowBand + 1;
        }
        else
            numInItems = pageSize;

        if (numInItems)
            sellectedItems = await Item
                .find({ status: 'activate' })
                .skip(lowBand - 1)
                .limit(numInItems)
                .sort('name')
                .select('_id name image');

        res.send({ 'lastPage': lastPage, 'items': sellectedItems, 'categories': allCategories });
    });

module.exports = router;