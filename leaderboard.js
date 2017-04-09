// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".
Markers = new Mongo.Collection('markers');
Playerz = new Mongo.Collection("playerz");
if (Meteor.isClient) {
  Meteor.startup(function() {
    GoogleMaps.load();
  });
  Template.map.helpers({
   mapOptions: function() {
     if (GoogleMaps.loaded()) {
       return {
         center: new google.maps.LatLng(18.5204, 73.8567),
         zoom: 12
       };
     }
   }
  });
  Template.map.onCreated(function() {
  GoogleMaps.ready('map', function(map) {

    var waypts = [];
    var markers = {};
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);
    Markers.find().observe({
      added: function(document) {
        // Create a marker for this document
        var marker = new google.maps.Marker({
          draggable: true,
          animation: google.maps.Animation.DROP,
          position: new google.maps.LatLng(document.lat, document.lng),
          map: map.instance,
          // We store the document _id on the marker in order
          // to update the document within the 'dragend' event below.
          id: document._id
        });
  // This listener lets us drag markers on the map and update their corresponding document.
        google.maps.event.addListener(marker, 'dragend', function(event) {
          Markers.update(marker.id, { $set: { lat: event.latLng.lat(), lng: event.latLng.lng() }});
        });

  // Store this marker instance within the markers object.
        markers[document._id] = marker;
        waypts.push({
            location : new google.maps.LatLng(document.lat, document.lng),
            stopover : true
        });
      },
      changed: function(newDocument, oldDocument) {
        markers[newDocument._id].setPosition({ lat: newDocument.lat, lng: newDocument.lng });
      },
      removed: function(oldDocument) {
        // Remove the marker from the map
        markers[oldDocument._id].setMap(null);

        // Clear the event listener
        google.maps.event.clearInstanceListeners(
          markers[oldDocument._id]);

  // Remove the reference to this marker instance
        delete markers[oldDocument._id];
      }
    // The code shown below goes here

    });
  });
});
  Template.leaderboard.helpers({
    players: function () {
      return Playerz.find({}, { sort: { garbage: -1, area: 1 } });
    },
    selectedName: function () {
      var player = Playerz.findOne(Session.get("selectedPlayer"));
      return player && player.area;
    }
  });

  Template.leaderboard.events({
    'click .inc': function () {
      Playerz.update(Session.get("selectedPlayer"), {$inc: {amount: 5}});
    }
  });

  Template.player.helpers({
    selected: function () {
      return Session.equals("selectedPlayer", this._id) ? "selected" : '';
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selectedPlayer", this._id);
    }
  });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {

    if (Playerz.find().count() === 0) {
      var areas = ["kothrud", "Pashan", "shivajinagar"
                   ];
      _.each(areas, function (area) {
        Playerz.insert({
          area: area,
          amount: Math.floor(Random.fraction() * 10) * 5
        });
      });
    }
  });
}
