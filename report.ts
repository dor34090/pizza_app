var mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  report: String,
});

var Report = mongoose.model("Report", reportSchema);
module.exports = Report;
