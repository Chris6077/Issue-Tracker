/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONN = process.env.CONN;

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get((req, res) => {
      let qry = req.query;
      if (qry._id) { qry._id = new ObjectId(qry._id) }
      if (qry.open) { qry.open = String(qry.open) == "true" }
      MongoClient.connect(CONN, (err, db) => {
        db.collection(req.params.project).find(qry).toArray((err, docs) => {res.status(200).json(docs)});
        db.close();
      });
    })
    
    .post((req, res) => {
      if(!req.body.issue_title || !req.body.issue_text || !req.body.created_by) res.status(403).send("missing inputs");
      else {
        let issue = {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_on: new Date(),
          updated_on: new Date(),
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to || '',
          open: true,
          status_text: req.body.status_text || ''
        };
        MongoClient.connect(CONN, (err, db) => {
          db.collection(req.params.project).insertOne(issue, (err, doc) => {
            issue._id = doc.insertedId;
            res.json(issue);
          });
          db.close();
        });
      }
    })
    
    .put((req, res) => {
      let update = Object.keys(req.body).reduce((obj, cur) => {
        if (req.body[cur] !== "" && cur !== "_id") obj[cur] = req.body[cur];
        return obj;
      },{});
      if(Object.keys(update).length > 0) update.updated_on = new Date();
      if(update.open === "false") update.open = false;
      MongoClient.connect(CONN, (err, db) => {
        db.collection(req.params.project).updateOne({_id:ObjectId(req.body._id)} ,{$set:update}, (err, docs) => {
          if(err){
            db.close();
            if (Object.keys(update).length ===0) return res.status(403).send("no updated field sent");
          }
          docs.result.n === 0 ? res.status(200).send('successfully updated') : res.status(200).send('successfully updated');
          db.close();
        });
      });
    })
    
    .delete((req, res) => {
      let issueId = req.body._id;
      if (!issueId) res.status(403).send("missing _id");
      else {
        MongoClient.connect(CONN, (err, db) => {
          db.collection(req.params.project).findAndRemove({_id:new ObjectId(issueId)}, (err,doc) => {
            !err ? res.status(403).send("deleted " + issueId) : res.status(500).send("could not delete " + issueId + " " + err);
          });
          db.close();
        });
      }
    });  
};