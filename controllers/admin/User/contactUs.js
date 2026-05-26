const Contact = require("../../../modal/contactUs");
 
// POST - Add Contact Details
// Endpoint: /contactUs/create-contact
const addContact = async (req, res) => {
 
    try {
 
        const contact = await Contact.create(req.body);
 
        res.status(201).json(contact);
 
    } catch (err) {
 
        res.status(400).json({ message: err.message });
 
    }
 
};
 
// GET - Get Contact Details
// Endpoint: /contactUs/get-contact
 
 
const getContact = async (req, res) => {
 
    try {
 
        const contact = await Contact.findOne();
 
        res.json(contact);
 
    } catch (err) {
 
        res.status(500).json({ message: err.message });
 
    }
 
};
 
// PUT - Update Contact Details
// Endpoint: /contactUs/update-contact
 
 
const updateContact = async (req, res) => {
 
    try {
 
        const contact = await Contact.findOneAndUpdate({}, req.body, { new: true });
 
        res.json(contact);
 
    } catch (err) {
 
        res.status(500).json({ message: err.message });
 
    }
 
};
 
module.exports = {
    addContact,
    updateContact,
    getContact
}
 