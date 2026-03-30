import { MongoClient } from 'mongodb';

async function check() {
    const uri = 'mongodb://tranphihao2k3_db_user:Phihao%402003@ac-j732pvd-shard-00-00.9hrfilj.mongodb.net:27017,ac-j732pvd-shard-00-01.9hrfilj.mongodb.net:27017,ac-j732pvd-shard-00-02.9hrfilj.mongodb.net:27017/nexgear?ssl=true&replicaSet=atlas-10uhn6-shard-0&authSource=admin&retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('nexgear');
    const settings = await db.collection('settings').find({}).toArray();
    console.log('Total setting documents:', settings.length);
    settings.forEach(s => {
        console.log(`siteId: ${s.siteId}, storeName: ${s.storeName}`);
    });
    await client.close();
}

check().catch(console.error);
