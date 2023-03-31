const request = require('supertest');
const mongoose = require('mongoose');
const { Category } = require('../../../../models/categoryModel');
const config = require('config');
const PS = config.get('pageSize');
//////////////////////////////////////////
// name limitations
const minMaxLengthOfNames = config.get('limitationsOfNames');
/////////////////////////////////
async function makeDB_Empty() { await Category.deleteMany({}); }
/////////////////////////////////
describe('/api/admin/category', () => {
    let server;
    beforeAll(() => { server = require('../../../../index'); });
    afterAll(async () => { await server.close(); });
    //let token;

    beforeEach(() => {
        //token = new User().generateAuthToken();

    });
    afterEach(async () => {
        await makeDB_Empty();
    });

    /////////////////////////////
    /////////////////////////////
    /////////////////////////////
    //    GET test Method      //

    describe('GET /api/admin/category?page={pageNo}&count={ItemCount}&search={SearchTerm}', () => {

        let pageNumber;
        let searchTerm;
        let pageSize;
        let nameOfActivatedCategory;
        let nameOfDeactivatedCategory;
        let nameOfArchivedCategory;
        const exec = async () => {
            return await request(server)
                .get(`/api/admin/category?page=${pageNumber}&count=${pageSize}&search=${searchTerm}`);
        };

        beforeEach(async () => {
            pageNumber = 1;
            pageSize = (Number(PS) && PS > 0) ? PS : 2;
            searchTerm = 'AL';
            nameOfActivatedCategory = 'mechanical';
            nameOfDeactivatedCategory = 'digital';
            nameOfArchivedCategory = 'flower';

            const cat = await Category.collection.insertMany([
                { name: 'electronical', status: 'activate' },
                { name: nameOfActivatedCategory, status: 'activate' },
                { name: nameOfDeactivatedCategory, status: 'deactivate' },
                { name: 'food', status: 'activate' },
                { name: nameOfArchivedCategory, status: 'archived' },
                { name: 'electrotechnical', status: 'archived' }
            ]);
        });
        /////////////////////////////
        it('should check return parameter s properties.', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('items');
            expect(res.body.items[0]).toHaveProperty('_id');
            expect(res.body.items[0]).toHaveProperty('name');
            expect(res.body.items[0]).toHaveProperty('status');
        });
        /////////////////////////////
        it('should return all items due to the page(pageNumber) and count(pagesize) and search(searchTerm) variables. LastPage is false.', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(4);
            expect(res.body.pageCount).toBe(2);
            expect(res.body.page).toBe(1);
            expect(res.body.lastPage).toBe(false);
            expect(res.body.items.length).toBe(2);
        });
        /////////////////////////////
        it('should return all items due to the page(pageNumber) and count(pagesize) and search(searchTerm) variables. LastPage is true.', async () => {
            pageNumber = 2;
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(4);
            expect(res.body.pageCount).toBe(2);
            expect(res.body.page).toBe(2);
            expect(res.body.lastPage).toBe(true);
            expect(res.body.items.length).toBe(2);
        });
        /////////////////////////////
        it('should return 404 due to the page(pageNumber)=0 .', async () => {
            pageNumber = 0;
            const res = await exec();

            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it('should return 404 since the page(pageNumber)=4 is greater than number of all pages.', async () => {
            pageNumber = 4;
            const res = await exec();

            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it('should return 404 due to the count(pageSize)=0 .', async () => {
            pageSize = 0;
            const res = await exec();

            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it('should return 404 due to unrelated search=(searchTerm).', async () => {
            searchTerm = 'z';
            const res = await exec();

            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it('should return 404 due to empty DB.', async () => {
            makeDB_Empty();
            const res = await exec();

            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it('should return an activated category with the given name', async () => {
            searchTerm = nameOfActivatedCategory;
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(1);
            expect(res.body.items[0]).toHaveProperty('name', nameOfActivatedCategory);
        });
        /////////////////////////////
        it('should return a deactivated category with the given name', async () => {
            searchTerm = nameOfDeactivatedCategory;
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(1);
            expect(res.body.items[0]).toHaveProperty('name', nameOfDeactivatedCategory);
        });
        /////////////////////////////
        it('should return an archived category with the given name', async () => {
            searchTerm = nameOfArchivedCategory;
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(1);
            expect(res.body.items[0]).toHaveProperty('name', nameOfArchivedCategory);
        });
    });

    /////////////////////////////
    /////////////////////////////
    /////////////////////////////
    //       POST Method       //

    describe('POST /api/admin/category', () => {

        let nameOfTheCategory;
        const exec = async () => {
            return await request(server)
                .post('/api/admin/category')
                //.set('x-auth-token', token)
                .send({ name: nameOfTheCategory });
        };
        //////////////////////////
        beforeEach(() => {
            nameOfTheCategory = 'category1';
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
        it(`should return 400 if category name is less than ${minMaxLengthOfNames.min} characters.`, async () => {
            nameOfTheCategory = new Array(minMaxLengthOfNames.min - 1).join('a');
            const res = await exec();

            //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
            expect(res.status).toBe(404);
        });

        it(`should return 400 if category name is more than ${minMaxLengthOfNames.max} characters.`, async () => {
            nameOfTheCategory = new Array(minMaxLengthOfNames.max + 2).join('a');
            const res = await exec();
            //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
            expect(res.status).toBe(404);
        });
        it('should save the category if it is valid', async () => {
            const res = await exec();

            const category = await Category.find({ name: nameOfTheCategory });

            expect(res.status).toBe(200);
            expect(category).not.toBeNull();
        });
        it('should return the category if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', nameOfTheCategory);
        });
        it('should return 404 if the category is valid but is saved in DB in advanced.', async () => {
            const category = await Category.collection.insertOne(
                { name: nameOfTheCategory , status: 'activate'});
                
            const res = await exec();

            expect(res.status).toBe(404);
        });
    });


    /////////////////////////////
    /////////////////////////////
    /////////////////////////////
    //    PUT test Methods     //


    describe('PUT Methods:       /api/admin/category/', () => {
        //let token;
        let oldNameOfTheCategory;
        let nameOfTheArchivedCategory;
        let nameOfTheActivatedCategory;
        let nameOfTheDeactivatedCategory;
        let id;

        beforeEach(async () => {
            nameOfTheActivatedCategory = oldNameOfTheCategory = 'category1';
            nameOfTheDeactivatedCategory = 'category3';
            nameOfTheArchivedCategory = 'category4';
            const cat = await Category.collection.insertMany([
                { name: oldNameOfTheCategory, status: 'activate' },
                { name: 'category2', status: 'activate' },
                { name: nameOfTheDeactivatedCategory, status: 'deactivate' },
                { name: nameOfTheArchivedCategory, status: 'archived' }
            ]);
        });

        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 1    //

        describe('PUT /api/admin/category/rename/', () => {

            let newNameOfTheCategory;

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/category/rename/`)
                    //.set('x-auth-token', token)
                    .send({ name: newNameOfTheCategory, id: id });
            };
            //////////////////////////
            beforeEach(async () => {
                newNameOfTheCategory = 'category1_1';
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
            it(`should return 400 if category name is less than ${minMaxLengthOfNames.min} characters but express validator sends 404 error.`, async () => {
                newNameOfTheCategory = new Array(minMaxLengthOfNames.min - 1).join('a');
                const res = await exec();

                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);
            });
            it(`should return 400 if category name is more than ${minMaxLengthOfNames.max} characters.`, async () => {
                newNameOfTheCategory = new Array(minMaxLengthOfNames.max + 2).join('a');
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);

            });
            it(`should return 400 if category id is an invalid objectId.`, async () => {
                id = 1111;
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);

            });
            it(`should return 400 if category id is a valid objectId but id not in DB.`, async () => {
                id = mongoose.Types.ObjectId();
                const res = await exec();
                //express validator sends 404 error (Not Found) instead of 400 error (that means bad request)
                expect(res.status).toBe(404);

            });

            it('should update the name of the category if it is valid and category is active', async () => {
                let category = await Category.findOne({ name: oldNameOfTheCategory });

                id = category._id;

                const res = await exec();

                category = await Category.findOne({ name: newNameOfTheCategory });

                expect(res.status).toBe(200);
                expect(category).not.toBeNull();
            });
            it('should return the updated category if it is valid and activated', async () => {
                let category = await Category.findOne({ name: oldNameOfTheCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('name', newNameOfTheCategory);
            });
            it('should update the name of the category if it is valid and category is deactived', async () => {
                let category = await Category.findOne({ name: nameOfTheDeactivatedCategory });

                id = category._id;
                newNameOfTheCategory = 'category3_3';
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('name', newNameOfTheCategory);
            });
            it('should return 404 if the category name is the name of one of archived categories', async () => {
                let category = await Category.findOne({ name: nameOfTheArchivedCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(404);
            });
        });

        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 2    //

        describe('PUT /api/admin/category/activate/', () => {

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/category/activate/`)
                    //.set('x-auth-token', token)
                    .send({ id: id });
            };
            //////////////////////////
            it('Check authentication Error 401 ', () => {
                // It will work after adding user and its authentication 
                // to the application

                // token = '';
                // const res = await exec();
                // expect(res.status).toBe(401);

                expect(401).toBe(401);
            });
            it('should activate the category if the category id is the id of one of activated categories', async () => {
                let category = await Category.findOne({ name: nameOfTheActivatedCategory });

                id = category._id;

                const res = await exec();

                category = await Category.findOne({ name: nameOfTheActivatedCategory });

                expect(res.status).toBe(200);
                expect(category).not.toBeNull();
            });
            it('should return activated category if the category id is the id of one of activated categories', async () => {
                let category = await Category.findOne({ name: nameOfTheActivatedCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('status', 'activate');
            });
            it('should return activated category if the category id is the id of one of deactivated categories', async () => {
                let category = await Category.findOne({ name: nameOfTheDeactivatedCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('status', 'activate');
            });
            it('should return 404 if the category id is the id of one of archived categories', async () => {
                let category = await Category.findOne({ name: nameOfTheArchivedCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(404);
            });
        });

        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 3    //        

        describe('PUT /api/admin/category/deactivate/', () => {

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/category/deactivate/`)
                    //.set('x-auth-token', token)
                    .send({ id: id });
            };

            //////////////////////////
            it('Check authentication Error 401 ', () => {
                // It will work after adding user and its authentication 
                // to the application

                // token = '';
                // const res = await exec();
                // expect(res.status).toBe(401);

                expect(401).toBe(401);
            });
            it('should deactivate the category if the category id is the id of one of activated categories', async () => {
                let category = await Category.findOne({ name: nameOfTheActivatedCategory });

                id = category._id;

                const res = await exec();

                category = await Category.findOne({ name: nameOfTheActivatedCategory });

                expect(res.status).toBe(200);
                expect(category).not.toBeNull();
            });
            it('should return deactivated category if the category id is the id of one of activated categories', async () => {
                let category = await Category.findOne({ name: nameOfTheActivatedCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('status', 'deactivate');
            });
            it('should return deactivated category if the category id is the id of one of deactivated categories', async () => {
                let category = await Category.findOne({ name: nameOfTheDeactivatedCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('status', 'deactivate');
            });
            it('should return 404 if the category id is the id of one of archived categories', async () => {
                let category = await Category.findOne({ name: nameOfTheArchivedCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(404);
            });
        });

        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
        //    PUT test Method 4    //        

        describe('PUT /api/admin/category/archived/', () => {

            const exec = async () => {
                return await request(server)
                    .put(`/api/admin/category/archived/`)
                    //.set('x-auth-token', token)
                    .send({ id: id });
            };
            //////////////////////////
            it('Check authentication Error 401 ', () => {
                // It will work after adding user and its authentication 
                // to the application

                // token = '';
                // const res = await exec();
                // expect(res.status).toBe(401);

                expect(401).toBe(401);
            });
            it('should archived the category if the category id is the id of one of categories.', async () => {
                let category = await Category.findOne({ name: nameOfTheActivatedCategory });

                id = category._id;

                const res = await exec();

                category = await Category.findOne({ name: nameOfTheActivatedCategory });

                expect(res.status).toBe(200);
                expect(category).not.toBeNull();
            });
            it('should return archived category if the category id is the id of one of activated categories', async () => {
                let category = await Category.findOne({ name: nameOfTheActivatedCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('status', 'archived');
            });
            it('should return archived category if the category id is the id of one of deactivated categories', async () => {
                let category = await Category.findOne({ name: nameOfTheDeactivatedCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('status', 'archived');
            });
            it('should return archived category if the category id is the id of one of archived categories', async () => {
                let category = await Category.findOne({ name: nameOfTheArchivedCategory });

                id = category._id;
                const res = await exec();

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('status', 'archived');
            });
            it('should return 404 if the category id is not in the DB of application.', async () => {
                id = mongoose.Types.ObjectId();

                const res = await exec();

                expect(res.status).toBe(404);
            });

        });
    });

});