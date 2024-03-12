var AWS = require('aws-sdk')
require('aws-sdk/lib/maintenance_mode_message').suppress = true

var region = "ca-central-1"
var accessKeyId = process.env.DYNAMODB_ACCESS_KEY_ID
var secretAccessKey = process.env.DYNAMODB_SECRET_ACCESS_KEY
var tableName = "Items"

AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region,
})

const dynamoDB = new AWS.DynamoDB.DocumentClient()

// Define the parameters for putting data into DynamoDB
const params = {
    TableName: tableName,
    Item: {
        item_id: {
            S: "123"
        }
    }
}
  
// Put data into DynamoDB
dynamoDB.put(params, (err, data) => {
    if (err) {
        console.error('Error writing to DynamoDB:', err);
    } else {
        console.log('Successfully wrote to DynamoDB:', data);
    }
})
