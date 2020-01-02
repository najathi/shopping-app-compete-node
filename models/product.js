const mongoose = require("mongoose");

// mongoose.Schema - it allows us to create new schema
const Schema = mongoose.Schema;

// Schema constructor has definition object parameter which means how to schema looks like.
const productSchema = new Schema({
  //title: String // String is shorthand for {type: String}
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  // relations (Association)
  userId: {
    type: Schema.Types.ObjectId,
    // referred to User Model
    ref: "User",
    required: true
  }
});

// Defines a model or retrieves it. Models defined on the mongoose
module.exports = mongoose.model("Product", productSchema);
