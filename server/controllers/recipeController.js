const fs = require('fs');
const path = require('path');
require('../models/database');
const Category = require('../models/Category');
const Recipe = require('../models/Recipe');
const cloudinary = require('../models/cloudinaryConfig'); 

/**
 * GET /
 * Homepage 
*/
exports.homepage = async (req, res) => {
  try {
    const limitNumber = 5;
    const categories = await Category.find({}).limit(limitNumber);
    const latest = await Recipe.find({}).sort({_id: -1}).limit(limitNumber);
    const north = await Recipe.find({ 'category': 'North Indian' }).limit(limitNumber);
    const south = await Recipe.find({ 'category': 'South Indian' }).limit(limitNumber);
    const central = await Recipe.find({ 'category': 'Central Indian' }).limit(limitNumber);
    const east = await Recipe.find({ 'category': 'East Indian' }).limit(limitNumber);
    const west = await Recipe.find({ 'category': 'West Indian' }).limit(limitNumber);

    const food = { latest, north, south, central, east, west };

    res.render('index', { title: 'Cooking Blog - Home', categories, food });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /categories
 * Categories 
*/
exports.exploreCategories = async (req, res) => {
  try {
    const limitNumber = 20;
    const categories = await Category.find({}).limit(limitNumber);
    res.render('categories', { title: 'Cooking Blog - Categories', categories });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /categories/:id
 * Categories By Id
*/
exports.exploreCategoriesById = async (req, res) => { 
  try {
    const categoryId = req.params.id;
    const limitNumber = 20;
    const categoryById = await Recipe.find({ 'category': categoryId }).limit(limitNumber);
    res.render('categories', { title: 'Cooking Blog - Categories', categoryById });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /recipe/:id
 * Recipe 
*/
exports.exploreRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const recipe = await Recipe.findById(recipeId);
    res.render('recipe', { title: 'Cooking Blog - Recipe', recipe });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * POST /search
 * Search 
*/
exports.searchRecipe = async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm;
    const recipe = await Recipe.find({ $text: { $search: searchTerm, $diacriticSensitive: true } });
    res.render('search', { title: 'Cooking Blog - Search', recipe });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /explore-latest
 * Explore Latest 
*/
exports.exploreLatest = async (req, res) => {
  try {
    const limitNumber = 20;
    const recipe = await Recipe.find({}).sort({ _id: -1 }).limit(limitNumber);
    res.render('explore-latest', { title: 'Cooking Blog - Explore Latest', recipe });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /explore-random
 * Explore Random 
*/
exports.exploreRandom = async (req, res) => {
  try {
    const count = await Recipe.countDocuments();
    const random = Math.floor(Math.random() * count);
    const recipe = await Recipe.findOne().skip(random).exec();
    res.render('explore-random', { title: 'Cooking Blog - Explore Random', recipe });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

exports.about = async (req, res) => {
  try {
    res.render('about', { title: 'Cooking Blog - About' });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Occurred" });
  }
};

/**
 * GET /submit-recipe
 * Submit Recipe
*/
exports.submitRecipe = async (req, res) => {
  const infoErrorsObj = req.flash('infoErrors');
  const infoSubmitObj = req.flash('infoSubmit');
  res.render('submit-recipe', { title: 'Cooking Blog - Submit Recipe', infoErrorsObj, infoSubmitObj });
};

/**
 * POST /submit-recipe
 * Submit Recipe
*/
exports.submitRecipeOnPost = async (req, res) => {
  try {
    let imageUploadFile;
    let newImageName = '';

    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('No files were uploaded.');
    } else {
      imageUploadFile = req.files.image;
      newImageName = Date.now() + '-' + imageUploadFile.name;

      // Temporary file path
      const tempPath = path.join(__dirname, 'tmp', newImageName);

      // Ensure the 'tmp' directory exists
      if (!fs.existsSync(path.join(__dirname, 'tmp'))) {
        fs.mkdirSync(path.join(__dirname, 'tmp'));
      }

      // Move file to the temporary directory
      await imageUploadFile.mv(tempPath);

      // Upload image to Cloudinary
      try {
        const result = await cloudinary.uploader.upload(tempPath, {
          public_id: `recipes/${newImageName}`,
          use_filename: true,
          unique_filename: false,
        });
        newImageName = result.secure_url; // Store the image URL from Cloudinary

        // Clean up: Remove the temporary file
        fs.unlinkSync(tempPath);
      } catch (error) {
        console.error('Error during Cloudinary upload:', error);
        // Clean up: Remove the temporary file in case of error
        fs.unlinkSync(tempPath);
        throw error;
      }
    }
    const newRecipe = new Recipe({
      name: req.body.name,
      description: req.body.description,
      source: req.body.source,
      ingredients: req.body.ingredients,
      category: req.body.category,
      image: newImageName, // Save the URL from Cloudinary
    });

    await newRecipe.save();

    req.flash('infoSubmit', 'Recipe has been added.');
    res.redirect('/submit-recipe');
  } catch (error) {
    req.flash('infoErrors', error.message || "Error Occurred");
    res.redirect('/submit-recipe');
  }
};

// Dummy Data Insertion (Uncomment to use)
// async function insertDummyCategoryData() {
//   try {
//     await Category.insertMany([
//       { "name": "Thai", "image": "thai-food.jpg" },
//       { "name": "American", "image": "american-food.jpg" },
//       { "name": "Chinese", "image": "chinese-food.jpg" },
//       { "name": "Mexican", "image": "mexican-food.jpg" },
//       { "name": "Indian", "image": "indian-food.jpg" },
//       { "name": "Spanish", "image": "spanish-food.jpg" }
//     ]);
//   } catch (error) {
//     console.error('Error inserting categories:', error);
//   }
// }

// insertDummyCategoryData();

// async function insertDummyRecipeData() {
//   try {
//     await Recipe.insertMany([
//       { 
//         "name": "Recipe Name Goes Here",
//         "description": "Recipe Description Goes Here",
//         "email": "recipeemail@raddy.co.uk",
//         "ingredients": [
//           "1 level teaspoon baking powder",
//           "1 level teaspoon cayenne pepper",
//           "1 level teaspoon hot smoked paprika"
//         ],
//         "category": "American", 
//         "image": "southern-fried-chicken.jpg"
//       },
//       { 
//         "name": "Recipe Name Goes Here",
//         "description": "Recipe Description Goes Here",
//         "email": "recipeemail@raddy.co.uk",
//         "ingredients": [
//           "1 level teaspoon baking powder",
//           "1 level teaspoon cayenne pepper",
//           "1 level teaspoon hot smoked paprika"
//         ],
//         "category": "American", 
//         "image": "southern-fried-chicken.jpg"
//       },
//     ]);
//   } catch (error) {
//     console.error('Error inserting recipes:', error);
//   }
// }

// insertDummyRecipeData();
