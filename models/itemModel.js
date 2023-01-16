const Joi = require('joi');
const mongoose = require('mongoose');
//////////////////////////////////////////
const config = require('config');
// name limitations
const minMaxLengthOfNames = config.get('limitationsOfNames');
// image path limitations
const minMaxLengthOfPath = config.get('limitationsOfPath');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        minlength: minMaxLengthOfNames.min,
        maxlength: minMaxLengthOfNames.max
      },
      image: {
        type: String,
        lowercase: true,
        default : 'apple.jpg',
        minlength: minMaxLengthOfPath.min,
        maxlength: minMaxLengthOfPath.max

      },
        status:{
          type: String, 
          lowercase: true,
          enum: ['activate' , 'deactivate' , 'archived'],
          default: 'activate'
        },
         categoryIds : {
           type: [ mongoose.Schema.Types.ObjectId ], 
           required:true,
           min  : 0,
           ref : 'Category'
         }       
});

const Item = mongoose.model('Item', itemSchema );

  ///////////////////////////////////////////////
  function validateItem(p_object) {
    const schema = Joi.object({
        name: Joi.string().min(minMaxLengthOfNames.min).max(minMaxLengthOfNames.max).required(),
        image: Joi.string().min(minMaxLengthOfPath.min).max(minMaxLengthOfPath.max) ,
        status: Joi.string() ,
        categoryIds:  Joi.array().items(Joi.objectId()).required().min(0)
      });
    
      const  { error, value } = schema.validate({ 
        name: p_object.name, 
        image: p_object.image,
        status: p_object.status  ,
        categoryIds: p_object.categoryIds 
      
      });
      return error;
}
//////////////////////////////////////////////////

  //module.exports.itemSchema = itemSchema;
  module.exports.Item = Item;
  module.exports.validateItem = validateItem;