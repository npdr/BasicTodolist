const express = require('express');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});

const itemsSchema = {
    name: String,
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
    name: 'Welcome to your todolist!',
});

const item2 = new Item({
    name: 'Hit the + button to add a new item.',
});

const item3 = new Item({
    name: '<-- Hit this to delete an item.',
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema],
};

const List = mongoose.model('List', listSchema);

app.set('view engine', 'ejs');

app.listen(3000, () => {
    console.log('Server is on! PORT: 3000');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/', (req, res) => {
    Item.find({}, (err, foundItems) => {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err) console.log(err);
                else console.log('Added the default items.');
            });
            res.redirect('/');

        } else {
            res.render('list', {
                listTitle: 'Today',
                newListItems: foundItems,
            });
        }
    });
});

app.get('/:customListName', (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({
        name: customListName
    }, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                // create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });

                list.save(() => {
                    res.redirect('/' + customListName);
                });

            } else {
                // render the existing list
                res.render('list', {
                    listTitle: foundList.name,
                    newListItems: foundList.items,
                });
            }

        } else console.log(err);
    });
});

app.post('/', (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    if (listName === 'Today') {
        item.save(() => {
            res.redirect('/');
        });
    } else {
        List.findOne({
            name: listName
        }, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        });
    }
});

app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === 'Today') {
        Item.findByIdAndDelete(checkedItemId, (err) => {
            if (err) console.log(err);
            else console.log('Successfully deleted.');
        });
        res.redirect('/');

    } else {
        List.findOneAndUpdate({
            name: listName,
        }, {
            $pull: {
                items: {
                    _id: checkedItemId,
                }
            },
        }, (err, foundList) => {
            if (!err) {
                res.redirect('/' + foundList.name);
            } else console.log(err);
        })
    }
});