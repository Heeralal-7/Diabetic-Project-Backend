const {Schema,model} = require('mongoose');

const Mealschema = Schema ({
    name:{
        type: String,
        default: ""
    },
    MealImage: {
        type: String,
        default: ""
    }
})
module.exports = model("Meal", Mealschema)