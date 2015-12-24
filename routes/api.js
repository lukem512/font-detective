/*
 * Serve JSON to our AngularJS client
 */

var fs = require('fs');
var AWS = require('aws-sdk');

// Set location to Ireland
AWS.config.region = "eu-west-1";

var s3 = new AWS.S3();
var defaultBucket = "fontdetective";

// Puts a file in specified (bucket, key)
function putFileS3(filename, folder, key, bucket, callback) {
  var body = fs.createReadStream(filename);
  putS3(body, folder, key, bucket, callback);
}

// Puts data in specified (bucket, key)
function putS3(body, folder, key, bucket, callback) {
  var metadata = { uploaded: Date.now().toString() };
  var fqkey = (folder != "") ? folder + "/" + key : key;
  var s3obj = new AWS.S3({params: {Bucket: bucket, Key: fqkey, Metadata: metadata}});
  s3obj.upload({Body: body}).
    on("httpUploadProgress", function(evt){
        console.log((evt.loaded / evt.total).toFixed(2) + "%");
    }).
    send(callback);
}

// Gets a file in specified (bucket, key)
function getFileS3(filename, folder, key, bucket, callback) {
  var params = {Bucket: bucket, Key: fqkey};
  var file = require('fs').createWriteStream(filename);
  s3.getObject(params).createReadStream().on("finish", callback).pipe(file);
}

// Gets data from specified (bucket, key)
// returns a callback with err, data
function getS3(callback, folder, key, bucket, callback) {
  var fqkey = (folder != "") ? folder + "/" + key : key;
  var params = {Bucket: bucket, Key: fqkey};
  s3.getObject(params, callback).send();
}

// Gets the link at which the resource may be accessed
function getLink(folder, key, bucket) {
  var fqkey = (folder != "") ? folder + "/" + key : key;
  return "https://s3-eu-west-1.amazonaws.com/" + bucket.toString() + "/" + fqkey.toString();
}

exports.upload = function (req, res) {
	var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);
        var path = __dirname + '/../files/' + filename;
        var folder = "img";
        fstream = fs.createWriteStream(path);
        file.pipe(fstream);
        fstream.on('close', function () {
            putFileS3(path, folder, filename, defaultBucket, function(){
                console.log(getLink(folder, filename, defaultBucket));
                res.redirect('back');
            });
        });
    });
}