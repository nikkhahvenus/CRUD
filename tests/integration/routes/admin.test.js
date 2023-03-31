const request = require('supertest');
const { Item } = require('../../../models/itemModel');
const { Category } = require('../../../models/categoryModel');
const config = require('config');
const PS = config.get('pageSize');

let server;
let categoryName;
let pageNumber;
let searchTerm;
let pageSize;
let archivedCategoryName;
describe('/api/admin', () => {
    beforeAll(() => { server = require('../../../index'); });
    afterAll(async () => { await server.close(); });

    describe('GET /items?page={pageNo}&count={ItemCount}&search={SearchTerm}&category={category}', () => {
        
        const exec = async () => {
            return await request(server)
                .get(`/api/admin/items?page=${pageNumber}&count=${pageSize}&search=${searchTerm}&category=${categoryName}`);
        };
        
        const unmatchedSearchTerm = 'wood';
        const undefinedCategoryName = 'food';

        beforeEach(async () => {
            categoryName = 'electronical';
            pageNumber = 1;
            pageSize = (Number(PS) && PS > 0) ? PS : 2;
            searchTerm = 'D';
            archivedCategoryName = 'electrical';
            const cat = await Category.collection.insertMany([
                { name: categoryName, status: 'activate' },
                { name: 'digital', status: 'deactivate' },
                { name: archivedCategoryName , status: 'archived' }
            ]);
            const items = await Item.collection.insertMany([
                { name: 'DVD', image: 'pic1.jpg', status: 'activate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'LED', image: 'pic2.jpg', status: 'activate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'LCD', image: 'pic3.jpg', status: 'deactivate', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'Motherboard', image: 'pic4.jpg', status: 'archived', categoryIds: [cat.insertedIds[0]._id, cat.insertedIds[1]._id] },
                { name: 'Graphic card', image: 'pic5.jpg', status: 'activate', categoryIds: [cat.insertedIds[2]._id] },
                { name: 'sound card', image: 'pic6.jpg', status: 'activate', categoryIds: [cat.insertedIds[2]._id] }
            ]);
        });
        afterEach(async () => {
            await makeDB_Empty();
        });
        /////////////////////////////
        it('should return all items due to the page(pageNumber) and count(pagesize) and search(searchTerm) and category={categoryName} variables. LastPage is true.', async () => {
            pageSize=3;
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(3);
            expect(res.body.pageCount).toBe(1);
            expect(res.body.page).toBe(1);
            expect(res.body.lastPage).toBe(true);
            expect(res.body.items.length).toBe(3);
            expect(res.body.items.some(g =>g.name == 'DVD' && g.image == 'pic1.jpg')).toBeTruthy();
            expect(res.body.items.some(g =>g.name == 'LED' && g.image == 'pic2.jpg')).toBeTruthy();
            expect(res.body.items.some(g =>g.name == 'LCD' && g.image == 'pic3.jpg')).toBeTruthy();
            expect(res.body.items[0]).toHaveProperty('_id');
        });
        /////////////////////////////
        it('should return all items due to the page(pageNumber) and count(pagesize) and search(searchTerm) and category={categoryName} variables. LastPage is false.', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(3);
            expect(res.body.pageCount).toBe(2);
            expect(res.body.page).toBe(1);
            expect(res.body.lastPage).toBe(false);
            expect(res.body.items.length).toBe(2);
            expect(res.body.items[0]).toHaveProperty('_id');
            expect(res.body.items[0]).toHaveProperty('name');
            expect(res.body.items[0]).toHaveProperty('image');
        });
        /////////////////////////////
        it('should return all items due to the page(pageNumber) and count(pagesize) and search(searchTerm) and category={categoryName} variables. LastPage is true.', async () => {
            pageNumber = 2;
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.totalCount).toBe(3);
            expect(res.body.pageCount).toBe(2);
            expect(res.body.page).toBe(2);
            expect(res.body.lastPage).toBe(true);
            expect(res.body.items.length).toBe(1);
            expect(res.body.items[0]).toHaveProperty('_id');
            expect(res.body.items[0]).toHaveProperty('name');
            expect(res.body.items[0]).toHaveProperty('image');
        });
        /////////////////////////////
        it('should return status = 404 when pageNumber is zero', async () => {
            pageNumber = 0;
            const res = await exec();

            expect(res.status).toBe(404);

        });
        /////////////////////////////
        it('should return status = 404 when pageNumber is zero', async () => {
            pageNumber = 3;
            const res = await exec();

            expect(res.status).toBe(404);

        });
        /////////////////////////////
        it('should return status = 404 when pagesize is zero', async () => {
            pageSize = 0;
            const res = await exec();

            expect(res.status).toBe(404);

        });
         /////////////////////////////
        it('should return status = 404 when category name does not exists.', async () => {
            categoryName = undefinedCategoryName;
            const res = await exec();

            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it('should return 404 because of an unmatchedSearchTerm', async () => {
            searchTerm = unmatchedSearchTerm;
            const res = await exec();

            expect(res.status).toBe(404);
        });
        /////////////////////////////
        it('should return 404 because of an archived category name that is asked in this request.', async () => {
            categoryName = archivedCategoryName;
            const res = await exec();

            expect(res.status).toBe(404);
        });
       /////////////////////////////
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