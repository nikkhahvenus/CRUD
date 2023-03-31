const request = require('supertest');
const { Item } = require('../../../models/itemModel');
const { Category } = require('../../../models/categoryModel');

let server;
let pageNumber;
let cat;

/////////////////////////////////
describe('/api/home/', () => {
    beforeAll(() => { server = require('../../../index'); });
    afterAll(async () => { await server.close(); });

    describe('GET: /api/home/{page}', () => {

        const exec = async () => {
            return await request(server)
                .get(`/api/home/${pageNumber}`);
        };

        beforeEach(async () => {
            pageNumber = 1;
            cat = await Category.collection.insertMany([
                { name: 'electronical', status: 'activate' },
                { name: 'digital', status: 'deactivate' },
                { name: 'electrical', status: 'archived' }
            ]);
            const items = await Item.collection.insertMany([
                { name: 'DVD', image: 'pic1.jpg', status: 'activate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'LED', image: 'pic2.jpg', status: 'activate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'LCD', image: 'pic3.jpg', status: 'deactivate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'Motherboard', image: 'pic4.jpg', status: 'archived', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[2]._id] },
            ]);
        });
        afterEach(async () => {
            await makeDB_Empty();
        });
        /////////////////////////////
        it('should return all items due to the page(pageNumber) variable. LastPage is true.', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.lastPage).toBe(true);
            expect(res.body.items.length).toBe(2);
            expect(res.body.items[0]).toHaveProperty('_id');
            expect(res.body.items.some(g => g.name == 'DVD' && g.image == 'pic1.jpg')).toBeTruthy();
            expect(res.body.items.some(g => g.name == 'LED' && g.image == 'pic2.jpg')).toBeTruthy();
            expect(res.body.items.some(g => g.name == 'LCD')).not.toBeTruthy();
            expect(res.body.items[0]).toHaveProperty('_id');
            expect(res.body.categories.length).toBe(1);
            expect(res.body.categories[0]).toHaveProperty('_id');
            expect(res.body.categories.some(g => g.name == 'electronical')).toBeTruthy();
            expect(res.body.categories.some(g => g.name == 'digital')).not.toBeTruthy();
            expect(res.body.categories.some(g => g.name == 'electrical')).not.toBeTruthy();
        });
        /////////////////////////////
        it('should return all items due to the page(pageNumber) variable. LastPage is false.', async () => {

            pageNumber = 1;
            const item = await Item.collection.insertOne(
                { name: 'CPU', image: 'pic5.jpg', status: 'activate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] }
            );

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.lastPage).toBe(false);
            expect(res.body.items.length).toBe(2);
            expect(res.body.items[0]).toHaveProperty('_id');
            expect(res.body.items[0]).toHaveProperty('name');
            expect(res.body.items[0]).toHaveProperty('image');
            expect(res.body.items.some(g => g.name == 'LCD')).not.toBeTruthy();
            expect(res.body.items.some(g => g.name == 'Motherboard')).not.toBeTruthy();
            expect(res.body.items[0]).toHaveProperty('_id');
            expect(res.body.categories.length).toBe(1);
            expect(res.body.categories[0]).toHaveProperty('_id');
            expect(res.body.categories.some(g => g.name == 'electronical')).toBeTruthy();
            expect(res.body.categories.some(g => g.name == 'digital')).not.toBeTruthy();
        });
        it('should return all items due to the page(pageNumber) variable. LastPage is true.', async () => {

            pageNumber = 2;
            const item = await Item.collection.insertOne(
                { name: 'CPU', image: 'pic5.jpg', status: 'activate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] }
            );

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.lastPage).toBe(true);
            expect(res.body.items.length).toBe(1);
            expect(res.body.items[0]).toHaveProperty('_id');
            expect(res.body.items[0]).toHaveProperty('name');
            expect(res.body.items[0]).toHaveProperty('image');
            expect(res.body.items.some(g => g.name == 'LCD')).not.toBeTruthy();
            expect(res.body.items[0]).toHaveProperty('_id');
            expect(res.body.categories.length).toBe(1);
            expect(res.body.categories[0]).toHaveProperty('_id');
            expect(res.body.categories.some(g => g.name == 'electronical')).toBeTruthy();
            expect(res.body.categories.some(g => g.name == 'digital')).not.toBeTruthy();
        });
        /////////////////////////////
        it('should return 404 error when page(pageNumber) variable is more than number of all pages.', async () => {
            pageNumber = 3;
            const res = await exec();

            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it('should return 404 error when page(pageNumber) variable is zero.', async () => {
            pageNumber = 0;
            const res = await exec();

            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it('should return 404 error when DB is empty from both categories and items.', async () => {
            await makeDB_Empty();

            const res = await exec();

            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it('should return 404 error when DB is empty of items.', async () => {
            await makeDB_EmptyOfItems();

            const res = await exec();

            expect(res.status).toBe(200);
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