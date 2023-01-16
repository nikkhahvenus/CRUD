const Joi = require('joi');
const mongoose = require('mongoose');

//////////////////////////////////////////
const config = require('config');
// name limitations
const minMaxLengthOfNames = config.get('limitationsOfNames');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        minlength: minMaxLengthOfNames.min,
        maxlength: minMaxLengthOfNames.max
      },
      status:{
        type: String, 
        lowercase: true,
        enum: ['activate' , 'deactivate' , 'archived'],
        default: 'activate'
      }
});

/////////////////////////////////////////////////
 //a static method
  categorySchema.statics.lookup = async function(categoryIds) {
    // 'this' is referencing to the category class
    let result;
     for( let i=0 ; i < categoryIds.length  ; i++){
         result = await this.findById( categoryIds[i]);
         if ( !result  ) 
           return i;
     }
    return -1;
  }

 const Category = mongoose.model('Category', categorySchema );
  ///////////////////////////////////////////////
  function validateCategory(p_object) {
    const schema = Joi.object({
        name: Joi.string().min(minMaxLengthOfNames.min).max(minMaxLengthOfNames.max).required(),
        status: Joi.string()
      });
    
      const  { error, value } = schema.validate({ name: p_object.name });
      return error;
}
//////////////////////////////////////////////////

  //module.exports.categorySchema = categorySchema;
  module.exports.Category = Category;
  module.exports.validateCategory = validateCategory;