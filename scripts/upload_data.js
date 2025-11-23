// upload_data.js

const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function uploadData(fileName, collectionName, addTimestamp = false) {
  try {
    if (!fs.existsSync(fileName)) {
      console.error(`❌ File ${fileName} not found!`);
      return;
    }

    console.log(`📁 Reading ${fileName}...`);
    const data = JSON.parse(fs.readFileSync(fileName, "utf8"));

    const batch = db.batch();
    let uploadCount = 0;

    data.forEach((item) => {
      if (item.id && item.name) {
        const docRef = db.collection(collectionName).doc(item.id);

        const payload = addTimestamp
          ? {
              ...item,
              createdAt: admin.firestore.Timestamp.now(),
              updatedAt: admin.firestore.Timestamp.now(), // ✅ added
            }
          : item;

        batch.set(docRef, payload);
        uploadCount++;
      }
    });

    await batch.commit();
    console.log(
      `✅ ${uploadCount} items uploaded to '${collectionName}' collection.`
    );
  } catch (error) {
    console.error(`❌ Error uploading data:`, error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage:
  node upload_data.js medical_conditions     # Upload medical conditions
  node upload_data.js categories             # Upload categories  
  node upload_data.js first_aid_resources    # Upload first aid kits
  node upload_data.js all                    # Upload all
  `);
  process.exit(1);
}

async function main() {
  const command = args[0];

  switch (command) {
    case "medical_conditions":
      await uploadData("medical_conditions.json", "medical_conditions");
      break;
    case "categories":
      await uploadData("categories.json", "categories");
      break;
    case "first_aid_resources":
      // ✅ Changed collection name to "resources"
      await uploadData("first_aid_resources.json", "resources", true);
      break;
    case "all":
      await uploadData("medical_conditions.json", "medical_conditions");
      await uploadData("categories.json", "categories");
      // ✅ Changed collection name to "resources"
      await uploadData("first_aid_resources.json", "resources", true);
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

main();
