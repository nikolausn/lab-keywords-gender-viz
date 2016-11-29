/**
 * BooksGender.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  connection: 'sqlitedb',
  attributes: {
  	// Date time of book release
  	date: {
  		type: 'date',
  		required: true
  	},
  	//Gender of author
  	authgender: {
  		type: 'string',
  		required: true
  	},
  	//Gender of character in the book
  	chargender: {
  		type: 'string',
  		required: true
  	},
  	//role of character
  	role: {
  		type: 'string',
  		required: true
  	},
  	//keyword used
  	word: {
  		type: 'string',
  		required: true
  	},
  	//count of word appearance
  	count: {
  		type: 'integer',
  		required: true
  	},

  	// Below is all specification for relations to another models if any


  	// Below is aggregate function
  	aggregateByKeywords: function(params,callback){
  	 return null;
  	}
  }
};

