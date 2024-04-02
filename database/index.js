const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://sword:MARIOCASTAÑEDA@nikobot.yet6agw.mongodb.net/?retryWrites=true&w=majority&appName=nikobot'; 

const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Conexión exitosa a la base de datos');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

connectToDatabase();