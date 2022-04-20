const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const url = "mongodb+srv://LHSAdmin:Password1@lhsclustor.90zaq.mongodb.net/LHSdev?retryWrites=true&w=majority";
const Json2csvParser = require("json2csv").Parser;
const fs = require("fs");

MongoClient.connect(url,async(err,db) => {
  if (err) throw err;
  var dbo = db.db("LHSdev");
  dbo
     .collection('userselections')
     .find({})
     .toArray(async(err,result) => {
       if(err) throw err;
       const newUser = await Promise.all(
        result.map(async(item) => {

          const events = await Promise.all(
            item.selectedEvent.map(async (d) => {
              return await dbo
                .collection("events")
                .findOne({ id: parseInt(d.eventId) })
                .then((data) => {
                  const eventInfo = {};
                  eventInfo.eventId = d.eventId;
                  eventInfo.raceName = data.raceName;
                  eventInfo.horseName = d.selectedHorse.name;
                  eventInfo.jockeyName = d.selectedHorse.jockey;
                  return eventInfo;
                });
            })
          );

          var round = await dbo
          .collection("tournamentrounds")
          .findOne({ _id: ObjectId(item.roundId) })
          .then((data) => {
            return data?.name;
          });

          var tournament = await dbo
          .collection("tournaments")
          .findOne({ _id: item.tournamentId })
          .then((data) => {
            return data?.name;
          });

          var email = await dbo
          .collection("users")
          .findOne({ _id: item.userId })
          .then((data) => {
            return data?.email;
          })

          var user =await dbo
          .collection("users")
          .findOne({ _id: item.userId })
          .then((data) => {
            // console.log(data)
            return data?.firstName + " " + data?.lastName;
          })

          let eventInfo = {};
          eventInfo.name = user;
          eventInfo.email = email;
          eventInfo.tournament = tournament;
          eventInfo.round = round;
          eventInfo.events = events;

          return eventInfo
       }))
       console.log(newUser,'newuser')
        const json2csvParser = new Json2csvParser({ header: true });
        const csvData = json2csvParser.parse(newUser);
        fs.writeFile("eventDetails.csv", csvData, function(error) {
          if (error) throw error;
          console.log("Write to eventDetails.csv successfully!");
        });
     })
})