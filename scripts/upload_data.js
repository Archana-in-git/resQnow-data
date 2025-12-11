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
      if (!item.id) {
        console.log(`⚠ Skipping item with no ID`, item);
        return;
      }

      const docRef = db.collection(collectionName).doc(item.id);

      const payload = addTimestamp
        ? {
            ...item,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
          }
        : item;

      batch.set(docRef, payload);
      uploadCount++;
    });

    await batch.commit();
    console.log(`✅ Uploaded ${uploadCount} items into '${collectionName}'.`);
  } catch (error) {
    console.error(`❌ Error uploading data:`, error);
  }
}

// ----------------------
// BLOOD DONOR SUPPORT
// ----------------------

async function uploadDonors() {
  const fileName = "donors.json";

  if (!fs.existsSync(fileName)) {
    console.log(`⚠ donors.json not found. Creating empty template.`);
    fs.writeFileSync(
      fileName,
      JSON.stringify(
        [
          {
            id: "test_donor_1",
            name: "Test Donor",
            age: 25,
            gender: "Male",
            bloodGroup: "O+",
            phone: "9999999999",
            phoneVerified: true,
            latitude: 12.9716,
            longitude: 77.5946,
            address: "Bangalore, India",
            lastDonationDate: null,
            totalDonations: 0,
            isAvailable: true,
            medicalConditions: ["None"],
            notes: "",
            profileImageUrl: null,
          },
        ],
        null,
        2
      )
    );
    console.log(`📄 Created donors.json template. Edit and re-run.`);
    return;
  }

  await uploadData("donors.json", "donors", true);
}

// ----------------------
// COMMAND HANDLER
// ----------------------

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage:
  node upload_data.js medical_conditions     
  node upload_data.js categories             
  node upload_data.js first_aid_resources    
  node upload_data.js donors
  node upload_data.js all    
`);
  process.exit(1);
}

(async () => {
  const command = args[0];

  switch (command) {
    case "medical_conditions":
      await uploadData("medical_conditions.json", "medical_conditions");
      break;

    case "categories":
      await uploadData("categories.json", "categories");
      break;

    case "first_aid_resources":
      await uploadData("first_aid_resources.json", "resources", true);
      break;

    case "donors":
      await uploadDonors();
      break;

    case "all":
      await uploadData("medical_conditions.json", "medical_conditions");
      await uploadData("categories.json", "categories");
      await uploadData("first_aid_resources.json", "resources", true);
      await uploadDonors();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
})();
