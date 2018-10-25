from flask import Flask, request, jsonify
import time
from flask_cors import CORS
from pymongo import MongoClient
import json
from bson.objectid import ObjectId

# initializations
app = Flask(__name__)
CORS(app)

app.config['MONGODB_SETTINGS'] = {
    'db': 'WriteFreeDB',
    'host': '127.0.0.1',
    'port': 27017
}

client = MongoClient('mongodb://localhost:27017/')
db = client['WriteFreeDB']
credentials_collection = db['credentials']
notes_collection = db['notes']


# create account and store info into DB
@app.route('/create-account', methods= ['POST', 'OPTIONS'])
def create():
    email = request.args['email']
    fullName = request.args['fullName']
    password = request.args['password']
    createdAt = str(time.time())

    if(credentials_collection.find_one({'email': email})):
        return "An account already exists with " + email, 401
    else:
        savedDocument = {
            "createdAt": createdAt,
            "email": email,
            "fullName": fullName,
            "password": password,
            "defaultNoteSettings": {},
        }
        credentials_collection.insert_one(savedDocument)
        savedDocument["_id"] = str(savedDocument["_id"])
        document = jsonify({"notes": [], "credentials": savedDocument})
        print(document)
        return (document, 200)

# verify username and password, returns account details and notes
@app.route('/login', methods= ['GET', 'OPTIONS'])
def login():
    email = request.args['email']
    password = request.args['password']
    credentials = credentials_collection.find_one({'email': email, 'password': password})
    print(credentials)
    if (credentials):
        credentials["_id"] = str(credentials["_id"])
        arrayOfNotes = getArrayOfNotes(email)
        return jsonify({"notes": arrayOfNotes, "credentials": credentials}), 200
    return "Invalid Username or Password", 401

@app.route('/get-notes', methods= ['GET', 'OPTIONS'])
def getNotes():
    email = request.args['email']
    arrayOfNotes = getArrayOfNotes(email)
    return jsonify({"notes": arrayOfNotes}), 200


@app.route ('/delete-note', methods= ['DELETE', 'OPTIONS'])
def deleteNote():
    email = request.args['email']
    noteID = request.args['noteID']
    notes_collection.delete_one({'email': email, "_id": ObjectId(noteID)})
    arrayOfNotes = getArrayOfNotes(email)
    return jsonify({"notes": arrayOfNotes}), 200


@app.route ('/new-note', methods= ['POST', 'OPTIONS'])
def addNote():
    email = request.args['email']
    baseNewNote = {
        "email": email,
        "title": None,
        "createdAt": str(time.time()),
        "content": None,
        "noteSettings": {},
        "category": None,

    }
    _id = notes_collection.insert(baseNewNote)
    x = notes_collection.find_one({"_id": ObjectId(_id)})
    x["_id"] = str(x["_id"])
    return jsonify(x), 200

@app.route ('/save-note', methods= ['POST', 'GET', 'OPTIONS'])
def saveNote():
    form_data = json.loads(request.get_data())
    query = {"_id": ObjectId(form_data["noteID"])}
    new_values={"title": form_data['title'], "category": form_data['category'], "content": form_data['noteContent']}
    notes_collection.update_one(query, {"$set": new_values})
    return "HI", 200

@app.route ('/update-default-settings', methods= ['POST', 'OPTIONS'])
def updateDefaultSettings():
    form_data = json.loads(request.get_data())
    email = form_data['email']
    noteColor = form_data['noteColor']
    applicationColor = form_data['applicationColor']
    font = form_data['font']
    query = {'$set': {'defaultNoteSettings': {'noteColor': noteColor, 'applicationColor': applicationColor, 'font': font}}}
    credentials_collection.find_one_and_update({'email': email}, query)
    return "HI", 200

@app.route ('/fetch-note', methods= ['GET', 'OPTIONS'])
def fetchNote():
    email = request.args['email']
    noteID = request.args['noteID']
    print(email, noteID)
    data = notes_collection.find_one({'email': email, "_id": ObjectId(noteID)})
    data["_id"] = str(data["_id"])
    return jsonify(data), 200



def getArrayOfNotes(email):
    userNotes = notes_collection.find({'email': email})
    arrayOfNotes = []
    for doc in userNotes:
        doc["_id"] = str(doc["_id"])
        arrayOfNotes.append(doc)
    return arrayOfNotes