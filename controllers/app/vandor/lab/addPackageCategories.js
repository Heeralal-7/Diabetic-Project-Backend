var PackageCategory = require('../../../../modal/addPackageCategories');
var csv = require('csvtojson');

const importData = async (req, res) => {
  try {

    var userData = await csv().fromFile(req.file.path);

    var formattedData = userData.map((response) => ({
      id: response.id,
      test_category: response.test_category,
      category_url: response.category_url,
      test_name: response.test_name,
      no_tests: response.no_tests,
      description: response.description,
      test_type: response.test_type,
      type: response.type,
      mrp: response.mrp,
      laboratries: response.laboratries,
      test_list: response.test_list,
      precaution: response.precaution,
      provide: response.provide,
      image: response.image,
    }));

    await PackageCategory.insertMany(formattedData);


    res.send({
      success: 1,
      message: 'Data imported successfully!',
    });

  } catch (error) {

    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



module.exports = { importData };
