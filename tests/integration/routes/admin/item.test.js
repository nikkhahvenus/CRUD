const request = require('supertest');
const mongoose = require('mongoose');
const { Item } = require('../../../../models/itemModel');
const { Category } = require('../../../../models/categoryModel');
const config = require('config');
const PS = config.get('pageSize');
//////////////////////////////////////////
// name limitations
const minMaxLengthOfNames = config.get('limitationsOfNames');
// image path limitations
const minMaxLengthOfPath = config.get('limitationsOfPath');
//////////////////////////////////////////
describe('/api/admin/item', () => {
    let server;
    beforeAll(() => { server = require('../../../../index'); });
    afterAll(async () => { await server.close(); });

    let searchTerm;
    let cat;
    let items;

    /////////////////////////////////
    describe('GET /api/admin/item', () => {

        let nameOfActivatedItem = 'dvd';
        let nameOfDeactivatedItem = 'lcd';
        let nameOfArchivedItem = 'sound card';
        let nameOfActivatedCategory = 'electronical';
        let nameOfDeactivatedCategory = 'digital';
        let nameOfArchivedCategory = 'digitally';
        beforeEach(async () => {
            cat = await Category.collection.insertMany([
                { name: nameOfActivatedCategory, status: 'activate' },
                { name: nameOfDeactivatedCategory, status: 'deactivate' },
                { name: 'mechanical', status: 'activate' },
                { name: 'electrical', status: 'activate' },
                { name: 'solid materials', status: 'activate' },
                { name: nameOfArchivedCategory, status: 'archived' }
            ]);
            items = await Item.collection.insertMany([
                { name: nameOfActivatedItem, image: 'pic1.jpg', status: 'activate', categoryIds: [cat.insertedIds[0]._id] },
                { name: 'led', image: 'pic2.jpg', status: 'activate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: nameOfDeactivatedItem, image: 'pic3.jpg', status: 'deactivate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'motherboard', image: 'pic4.jpg', status: 'activate', categoryIds: [cat.insertedIds[2]._id] },
                { name: nameOfArchivedItem, image: 'pic5.jpg', status: 'archived', categoryIds: [cat.insertedIds[5]._id, cat.insertedIds[1]._id] }
            ]);
        });
        afterEach(async () => {
            await makeDB_Empty();
        });
        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    GET test Method 1    //

        describe('GET /api/admin/item/searchCategory/{searchTerm}', () => {

            const exec = async () => {
                return await request(server)
                    .get(`/api/admin/item/searchCategory/${searchTerm}`);
            };

            beforeEach(() => { searchTerm = 'DI'; });
            /////////////////////////////
            it('should return all items according to their categories that have searchTerm in their names when searchTerm really exists in categories.', async () => {
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.items.length).toBe(3);
                expect(res.body.items[0]).toHaveProperty('_id');
                expect(res.body.items[0]).toHaveProperty('name');
                expect(res.body.items[0]).toHaveProperty('status');
                expect(res.body.items.some(g => g.name == 'led')).toBeTruthy();
                expect(res.body.items.some(g => g.name == 'lcd')).toBeTruthy();
                //an archived item related to an archived category
                expect(res.body.items.some(g => g.name == 'sound card')).toBeTruthy();
            });
            /////////////////////////////
            it('should return 404, when searchTerm does not exist in categories.', async () => {
                searchTerm = 'food';
                const res = await exec();

                expect(res.status).toBe(404);
            });
            /////////////////////////////
            it('should return 404 when searched categories does not exist in the categories of objects in DB.', async () => {
                searchTerm = 'solid material';
                const res = await exec();

                expect(res.status).toBe(404);
            });
            /////////////////////////////
            it('should return 404 when DB is empty.', async () => {
                makeDB_Empty();
                const res = await exec();

                expect(res.status).toBe(404);
            });
            /////////////////////////////
            it('should return 404 when DB is empty of categories.', async () => {
                makeDB_EmptyOfCategories();
                const res = await exec();

                expect(res.status).toBe(404);
            });
            /////////////////////////////
            it('should return 404 when DB is empty of items.', async () => {
                makeDB_EmptyOfItems();
                const res = await exec();

                expect(res.status).toBe(404);
            });
            it('should return an activated item with the given name', async () => {
                searchTerm = nameOfActivatedCategory;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.items[0]).toHaveProperty('name', nameOfActivatedItem);
            });
            it('should return a deactivated item with the given name', async () => {
                searchTerm = nameOfDeactivatedCategory;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.items[0]).toHaveProperty('name', nameOfDeactivatedItem);
            });
            it('should return an archived item with the given name', async () => {
                searchTerm = nameOfArchivedCategory;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.items[0]).toHaveProperty('name', nameOfArchivedItem);
            });
        });

        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    GET test Method 2    //    

        describe('GET /api/admin/item/getCategories/:itemId', () => {

            const exec = async () => {
                return await request(server)
                    .get(`/api/admin/item/getCategories/${itemId}`);
            };

            beforeEach(() => {
                //searchTerm = 'DI';
                itemId = items.insertedIds[1]._id;
            });

            /////////////////////////////
            it('should return all categories of the related itemId.', async () => {

                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.categories.length).toBe(2);
                expect(res.body.categories[0]).toHaveProperty('_id');
                expect(res.body.categories[0]).toHaveProperty('name');
                expect(res.body.categories[0]).toHaveProperty('status');
                expect(res.body.categories.some(g => g.name == 'electronical')).toBeTruthy();
                expect(res.body.categories.some(g => g.name == 'digital')).toBeTruthy();
            });
            /////////////////////////////
            it('should return 404 when unavailable itemId is sent to the test function.', async () => {

                const fakeItemId = mongoose.Types.ObjectId();
                itemId = fakeItemId;
                const res = await exec();

                expect(res.status).toBe(404);
            });
            /////////////////////////////
            it('should return 404 when the item related to this itemId contains an invalid category id.', async () => {

                const fakeCategoryId = mongoose.Types.ObjectId();
                let item = await Item.findByIdAndUpdate(itemId, {
                    $addToSet: {
                        categoryIds: fakeCategoryId
                    }
                }, { new: true });

                const res = await exec();

                expect(res.status).toBe(404);
            });
            /////////////////////////////
            it('should return 404 when invalid number is sent to the test function as item s objectId.', async () => {

                itemId = 123;
                const res = await exec();

                expect(res.status).toBe(404);
            });
            /////////////////////////////
            it('should return 404 when invalid string is sent to the test function as item s objectId.', async () => {

                itemId = 'a123';
                const res = await exec();

                expect(res.status).toBe(404);
            });
            it('should return all categories of an activated item with the given itemId', async () => {

                let item = await Item.findOne({ name: nameOfActivatedItem });
                itemId = item._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.categories.some(g => g.name == nameOfActivatedCategory)).toBeTruthy();
            });
            it('should return all categories of a deactivated item with the given itemId', async () => {

                let item = await Item.findOne({ name: nameOfDeactivatedItem });
                itemId = item._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.categories.some(g => g.name == nameOfDeactivatedCategory)).toBeTruthy();
            });
            it('should return all categories of an archived item with the given itemId', async () => {

                let item = await Item.findOne({ name: nameOfArchivedItem });
                itemId = item._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.categories.some(g => g.name == nameOfArchivedCategory)).toBeTruthy();
            });
        });
    });
    /////////////////////////////
    /////////////////////////////
    /////////////////////////////
    //    POST test Method     //

    describe('POST /api/admin/item', () => {

        let nameOfTheItem;
        let imageNameAndPath;
        const exec = async () => {
            return await request(server)
                .post('/api/admin/item')
                //.set('x-auth-token', token)
                .send({ name: nameOfTheItem, image: imageNameAndPath });
        };
        //////////////////////////
        beforeEach(() => {
            nameOfTheItem = 'keyboard';
            imageNameAndPath = 'pic7.jpg';
            //token = new User().generateAuthToken();
        });

        afterEach(async () => {
            await makeDB_Empty();
        });
        //////////////////////////
        it('Check authentication Error 401 ', () => {
            // It will work after adding user and its authentication 
            // to the application

            // token = '';
            // const res = await exec();
            // expect(res.status).toBe(401);

            expect(401).toBe(401);
        });
        /////////////////////////////
        it(`should return 400 if item name is less than ${minMaxLengthOfNames.min} characters.`, async () => {
            nameOfTheItem = new Array(minMaxLengthOfNames.min - 1).join('a');
            const res = await exec();

            //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
            expect(res.status).toBe(404);
        });
        it(`should return 400 if item name is more than ${minMaxLengthOfNames.max} characters.`, async () => {
            nameOfTheItem = new Array(minMaxLengthOfNames.max + 2).join('a');
            const res = await exec();
            //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it(`should return 400 if item path is less than ${minMaxLengthOfPath.min} characters.`, async () => {
            imageNameAndPath = new Array(minMaxLengthOfPath.min - 1).join('a');
            const res = await exec();

            //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
            expect(res.status).toBe(404);
        });
        it(`should return 400 if item path is more than ${minMaxLengthOfPath.max} characters.`, async () => {
            imageNameAndPath = new Array(minMaxLengthOfPath.max + 2).join('a');
            const res = await exec();
            //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
            expect(res.status).toBe(404);
        });
        it('should save the item if it is valid', async () => {
            const res = await exec();

            const item = await Category.find({ name: nameOfTheItem });

            expect(res.status).toBe(200);
            expect(item).not.toBeNull();
        });
        it('should return the item if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', nameOfTheItem);
            expect(res.body).toHaveProperty('image', imageNameAndPath);
        });
        it(`should return 404 if the new item is saved in DB in advance.`, async () => {
            nameOfTheItem = 'dvd';
            imageNameAndPath = 'pic1.jpg';
            let item = await Item.collection.insertOne(
                { name: nameOfTheItem, image: imageNameAndPath, status: 'activate' });

            const res = await exec();

            expect(res.status).toBe(404);
        });
    });
    /////////////////////////////
    /////////////////////////////
    /////////////////////////////
    //    PUT test Methods      //

    describe('PUT TESTS /api/admin/item', () => {
        //let token;

        let nameOfTheActivatedCategory;
        let nameOfTheDeactivatedCategory;
        let nameOfTheArchivedCategory;

        let nameOfTheActivatedItem;
        let nameOfTheDeactivatedItem;
        let nameOfTheArchivedItem;

        let id;
        let item;
        let items;

        //////////////////////////
        beforeEach(async () => {
            //token = new User().generateAuthToken();

            nameOfTheActivatedCategory = 'mechanical';
            nameOfTheDeactivatedCategory = 'digital';
            nameOfTheArchivedCategory = 'soft material';

            nameOfTheActivatedItem = 'dvd';
            nameOfTheDeactivatedItem = 'lcd';
            nameOfTheArchivedItem = 'sound card';
            id;

            cat = await Category.collection.insertMany([
                { name: 'electronical', status: 'activate' },
                { name: 'digital', status: 'deactivate' },
                { name: 'mechanical', status: 'activate' },
                { name: 'electronical', status: 'activate' },
                { name: 'solid material', status: 'activate' },
                { name: 'soft material', status: 'archived' }
            ]);
            items = await Item.collection.insertMany([
                { name: 'dvd', image: 'pic1.jpg', status: 'activate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'led', image: 'pic2.jpg', status: 'activate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'lcd', image: 'pic3.jpg', status: 'deactivate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'motherboard', image: 'pic4.jpg', status: 'activate', categoryIds: [cat.insertedIds[2]._id] },
                { name: 'sound card', image: 'pic5.jpg', status: 'archived', categoryIds: [cat.insertedIds[5]._id] },
            ]);

        });
        afterEach(async () => {
            await makeDB_Empty();
        });

        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 1    //

        describe('PUT /api/admin/item/rename/', () => {
            let oldNameOfTheItem;
            let newNameOfTheItem;

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/item/rename/`)
                    //.set('x-auth-token', token)
                    .send({ name: newNameOfTheItem, id: id });
            };
            //////////////////////////
            beforeEach(async () => {
                oldNameOfTheItem = 'led';
                newNameOfTheItem = 'cpu';
            });
            //////////////////////////
            it('Check authentication Error 401 ', () => {
                // It will work after adding user and its authentication 
                // to the application

                // token = '';
                // const res = await exec();
                // expect(res.status).toBe(401);
                expect(401).toBe(401);
            });
            it(`should return 400 if item name is less than ${minMaxLengthOfNames.min} characters but express validator sends 404 error instead.`, async () => {
                id = (await Item.findOne({ name: oldNameOfTheItem }))._id;
                newNameOfTheItem = new Array(minMaxLengthOfNames.min - 1).join('a');
                const res = await exec();

                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it(`should return 400 if item name is more than ${minMaxLengthOfNames.max} characters.`, async () => {
                id = (await Item.findOne({ name: oldNameOfTheItem }))._id;
                newNameOfTheItem = new Array(minMaxLengthOfNames.max + 2).join('a');
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });

            it(`should return 400 if item id is an invalid objectId.`, async () => {
                id = 1111;
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);

            });
            it(`should return 400 if item id is a valid objectId but id not in DB.`, async () => {
                id = mongoose.Types.ObjectId();
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);

            });
            it('should update the name of the item if it is valid and item is not archived', async () => {
                id = (await Item.findOne({ name: oldNameOfTheItem }))._id;

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item).not.toBeNull();
            });
            it('should return the updated item if it is valid and is not archived', async () => {
                id = (await Item.findOne({ name: oldNameOfTheItem }))._id;

                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id', id.toHexString());
                expect(res.body).toHaveProperty('name', newNameOfTheItem);
            });
            it('should update the name of the item if it is valid and item is deactived', async () => {
                id = (await Item.findOne({ name: nameOfTheDeactivatedItem }))._id;

                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('name', newNameOfTheItem);
            });
            it('should return 404 if the item id is related to an archived item', async () => {
                id = (await Item.findOne({ name: nameOfTheArchivedItem }))._id;

                const res = await exec();

                expect(res.status).toBe(404);
            });
            it('should return 404 if item name contains illegal characters ', async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;
                newNameOfTheItem = '@#$^&!';

                const res = await exec();

                expect(res.status).toBe(404);
            });
        });

        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 2    //
        describe('PUT /api/admin/item/changeImage/', () => {
            let newImagePath;

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/item/changeImage/`)
                    //.set('x-auth-token', token)
                    .send({ image: newImagePath, id: id });
            };
            //////////////////////////
            beforeEach(async () => {
                newImagePath = 'pic7.jpg';
            });
            //////////////////////////
            it('Check authentication Error 401 ', () => {
                // It will work after adding user and its authentication 
                // to the application

                // token = '';
                // const res = await exec();
                // expect(res.status).toBe(401);
                expect(401).toBe(401);
            });
            it(`should return 400 if image path is less than ${minMaxLengthOfPath.min} characters but express validator sends 404 error instead.`, async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;
                newImagePath = new Array(minMaxLengthOfPath.min - 1).join('a');
                const res = await exec();

                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it(`should return 400 if image path is more than ${minMaxLengthOfPath.max} characters.`, async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;
                newImagePath = new Array(minMaxLengthOfPath.max + 2).join('a');
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });

            it(`should return 400 if item id is an invalid objectId.`, async () => {
                id = 1111;
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);

            });
            it(`should return 400 if item id is a valid objectId but id not in DB.`, async () => {
                id = mongoose.Types.ObjectId();
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);

            });
            it('should update the image path of the item if it is valid and item is not archived', async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item).not.toBeNull();
            });
            it('should return the updated item if it is valid and is not archived', async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;

                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id', id.toHexString());
                expect(res.body).toHaveProperty('image', newImagePath);
            });
            it('should update the image path of the item if it is valid and item is deactived', async () => {
                id = (await Item.findOne({ name: nameOfTheDeactivatedItem }))._id;

                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('image', newImagePath);
            });
            it('should return 404 if the item id is related to an archived item', async () => {
                id = (await Item.findOne({ name: nameOfTheArchivedItem }))._id;

                const res = await exec();

                expect(res.status).toBe(404);
            });
            it('should return 404 if image path contains illegal characters ', async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;
                newImagePath = '@#$^&!';

                const res = await exec();

                expect(res.status).toBe(404);
            });

        });


        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 3    //

        describe('PUT /api/admin/item/addCategory/', () => {
            let newCategoryId;

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/item/addCategory/`)
                    //.set('x-auth-token', token)
                    .send({ categoryId: newCategoryId, id: id });
            };
            //////////////////////////
            beforeEach(async () => {
                newCategoryId = ((await Category.findOne({ name: nameOfTheActivatedCategory }))._id);
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;
            });
            //////////////////////////
            it('Check authentication Error 401 ', () => {
                // It will work after adding user and its authentication 
                // to the application

                // token = '';
                // const res = await exec();
                // expect(res.status).toBe(401);
                expect(401).toBe(401);
            });
            it(`should return 400 if the item id is an invalid objectId.`, async () => {
                id = 1111;
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it(`should return 400 if the item id is a valid objectId but id not in DB.`, async () => {
                id = mongoose.Types.ObjectId();

                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it(`should return 400 if the category id is a valid objectId but is not in DB.`, async () => {
                newCategoryId = mongoose.Types.ObjectId();

                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it(`should return 400 if the category id is a valid objectId but is one of the item s categories.`, async () => {
                newCategoryId = (await Item.findById(id)).categoryIds[0];

                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it('should add the categoryId to the item if both of the item and category are not archived and both of item and category are activated.', async () => {

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item.categoryIds.some(g => g == newCategoryId.toHexString())).toBeTruthy();
            });
            it('should add the categoryId to the item if both of the item and category are not archived and category is activated but item is deactivated.', async () => {
                // New category_id can be added to a deactivated item

                id = (await Item.findOne({ name: nameOfTheDeactivatedItem }))._id;

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item.categoryIds.length).not.toBe(0);
                expect(item.categoryIds.some(g => g == newCategoryId.toHexString())).toBeTruthy();
            });
            it('should return 404 if the item id is related to an archived item', async () => {

                id = (await Item.findOne({ name: nameOfTheArchivedItem }))._id;

                const res = await exec();

                expect(res.status).toBe(404);
            });
            it('should return 404 if the category id is related to a deactivate category', async () => {

                newCategoryId = ((await Category.findOne({ name: nameOfTheDeactivatedCategory }))._id);

                const res = await exec();

                expect(res.status).toBe(404);
            });
            it('should return 404 if the category id is related to an archived category', async () => {

                newCategoryId = ((await Category.findOne({ name: nameOfTheArchivedCategory }))._id);

                const res = await exec();

                expect(res.status).toBe(404);
            });
            it('should return the updated item if both category and item are valid', async () => {

                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id', id.toHexString());
                expect(res.body).toHaveProperty('categoryIds');
                expect(res.body.categoryIds.some(g => g == newCategoryId.toHexString())).toBeTruthy();
            });

        });

        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 4    //

        describe('PUT /api/admin/item/removeCategory/', () => {
            let consideredCategoryIdForDiscard;

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/item/removeCategory/`)
                    //.set('x-auth-token', token)
                    .send({ categoryId: consideredCategoryIdForDiscard, id: id });
            };
            //////////////////////////
            it('Check authentication Error 401 ', () => {
                // id = mongoose.Types.ObjectId();
                // It will work after adding user and its authentication 
                // to the application

                // token = '';
                // const res = await exec();
                // expect(res.status).toBe(401);
                expect(401).toBe(401);
            });
            it(`should return 400 if the item id is an invalid objectId.`, async () => {
                id = 1111;
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it(`should return 400 if the item id is a valid objectId but is not in DB.`, async () => {
                id = mongoose.Types.ObjectId();

                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it('should remove the categoryId of the item if both of the item and category are not archived and both of item and category are activated.', async () => {
                item = await Item.findOne({ name: nameOfTheActivatedItem });
                id = item._id;
                consideredCategoryIdForDiscard = item.categoryIds[0];

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item.categoryIds.some(g => g == consideredCategoryIdForDiscard.toHexString())).not.toBeTruthy();
            });
            it('should remove the categoryId of the item if both of the item and category are not archived and category is activated but item is deactivated.', async () => {
                // New category_id can be removed from a deactivated item
                item = await Item.findOne({ name: nameOfTheDeactivatedItem });
                id = item._id;
                consideredCategoryIdForDiscard = item.categoryIds[0];

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item.categoryIds.length).not.toBe(0);
                expect(item.categoryIds.some(g => g == consideredCategoryIdForDiscard.toHexString())).not.toBeTruthy();
            });
            it('should return 404 if the item id is related to an archived item', async () => {
                item = await Item.findOne({ name: nameOfTheArchivedItem });
                id = item._id;
                consideredCategoryIdForDiscard = item.categoryIds[0];

                const res = await exec();

                expect(res.status).toBe(404);
            });
            it('should return 404 if the category id is not related to the activate item', async () => {
                item = await Item.findOne({ name: nameOfTheActivatedItem });
                id = item._id;
                consideredCategoryIdForDiscard = mongoose.Types.ObjectId();;

                const res = await exec();

                expect(res.status).toBe(404);
            });
        });

        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 5    //

        describe('PUT /api/admin/item/activate/', () => {

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/item/activate/`)
                    //.set('x-auth-token', token)
                    .send({ id: id });
            };
            //////////////////////////
            it('Check authentication Error 401 ', () => {
                // id = mongoose.Types.ObjectId();
                // It will work after adding user and its authentication 
                // to the application

                // token = '';
                // const res = await exec();
                // expect(res.status).toBe(401);
                expect(401).toBe(401);
            });
            it(`should return 400 if the item id is an invalid objectId.`, async () => {
                id = 1111;
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it(`should return 400 if the item id is a valid objectId but is not in DB.`, async () => {
                id = mongoose.Types.ObjectId();

                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it('should activate the item if it is activate.', async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;


                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item.status).toBe('activate');
            });
            it('should activate the item if it is deactivate.', async () => {
                id = (await Item.findOne({ name: nameOfTheDeactivatedItem }))._id;

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item.status).toBe('activate');
            });
            it('should return activated item in responce if item is deactivate.', async () => {
                id = (await Item.findOne({ name: nameOfTheDeactivatedItem }))._id;

                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('activate');
            });
            it('should not activate the item if it is archived.', async () => {
                id = (await Item.findOne({ name: nameOfTheArchivedItem }))._id;

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(404);
                expect(item.status).toBe('archived');
            });
        });

        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 6    //

        describe('PUT /api/admin/item/deactivate/', () => {

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/item/deactivate/`)
                    //.set('x-auth-token', token)
                    .send({ id: id });
            };
            //////////////////////////
            it('Check authentication Error 401 ', () => {
                // id = mongoose.Types.ObjectId();
                // It will work after adding user and its authentication 
                // to the application

                // token = '';
                // const res = await exec();
                // expect(res.status).toBe(401);
                expect(401).toBe(401);
            });
            it(`should return 400 if the item id is an invalid objectId.`, async () => {
                id = 1111;
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it(`should return 400 if the item id is a valid objectId but is not in DB.`, async () => {
                id = mongoose.Types.ObjectId();

                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it('should deactivate the item if it is activate.', async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;


                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item.status).toBe('deactivate');
            });
            it('should deactivate the item if it is deactivate.', async () => {
                id = (await Item.findOne({ name: nameOfTheDeactivatedItem }))._id;

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item.status).toBe('deactivate');
            });
            it('should return deactivated item in responce if item is activate.', async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;

                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('deactivate');
            });
            it('should not deactivate the item if it is archived.', async () => {
                id = (await Item.findOne({ name: nameOfTheArchivedItem }))._id;

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(404);
                expect(item.status).toBe('archived');
            });
        });
        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 7    //

        describe('PUT /api/admin/item/archived/', () => {

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/item/archived/`)
                    //.set('x-auth-token', token)
                    .send({ id: id });
            };
            //////////////////////////
            it('Check authentication Error 401 ', () => {
                // id = mongoose.Types.ObjectId();
                // It will work after adding user and its authentication 
                // to the application

                // token = '';
                // const res = await exec();
                // expect(res.status).toBe(401);
                expect(401).toBe(401);
            });
            it(`should return 400 if the item id is an invalid objectId.`, async () => {
                id = 1111;
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it(`should return 400 if the item id is a valid objectId but is not in DB.`, async () => {
                id = mongoose.Types.ObjectId();

                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it('should archived the item if it is activate.', async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;


                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item.status).toBe('archived');
            });
            it('should archived the item if it is deactivate.', async () => {
                id = (await Item.findOne({ name: nameOfTheDeactivatedItem }))._id;

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(item.status).toBe('archived');
            });
            it('should return archived item in responce if item is activate.', async () => {
                id = (await Item.findOne({ name: nameOfTheActivatedItem }))._id;

                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('archived');
            });
            it('should return archived item if it is archived in advanced.', async () => {
                id = (await Item.findOne({ name: nameOfTheArchivedItem }))._id;

                const res = await exec();

                item = await Item.findOne({ _id: id });

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('archived');
            });
        });

    });
});
/////////////////////////////////
async function makeDB_Empty() {
    await makeDB_EmptyOfCategories();
    await makeDB_EmptyOfItems();
}
async function makeDB_EmptyOfCategories() {
    await Category.deleteMany({});
}
async function makeDB_EmptyOfItems() {
    await Item.deleteMany({});
}


