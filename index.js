var firebase = require('firebase-admin');
var request = require('request');
var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

var API_KEY = ""; // Your Firebase Cloud Messaging Server API key

// Fetch the service account key JSON file contents
var serviceAccount = require("./api-project.json");

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: ""
});
ref = firebase.database().ref();

function listenForNotificationRequests() {
    var requests = ref.child('notifications');
    requests.on('child_added', function(requestSnapshot) {
        var request = requestSnapshot.val();
        sendNotificationToUser(
            request.username,
            request.message,
            function() {
                requestSnapshot.ref.remove();
            }
        );
    }, function(error) {
        console.error(error);
    });
}

function sendNotificationToUser(username, message, onSuccess) {
    console.log(username);
    console.log(message);
    request({
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {
            'Content-Type' :' application/json',
            'Authorization': 'key=' + API_KEY
        },
        body: JSON.stringify({
            notification: {
                title: "Repair City",
                body: message,
                sound: 'default'
            },
            to : '/topics/user_' + username,
            priority: 'high'
        })
    }, function(error, response, body) {
        if (error) {
            console.error(error);
        } else if (response.statusCode >= 400) {
            console.error('HTTP Error: '+response.statusCode+' - '+response.statusMessage);
        } else {
            onSuccess(); //richiama la funzione passata, per rimuovere il record da firebase
        }
    });
}

// start listening
listenForNotificationRequests();