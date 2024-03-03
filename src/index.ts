import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

/**
 * `foodsStorage` - it's a key-value datastructure that is used to store foods.
 * {@link StableBTreeMap} is a self-balancing tree that acts as a durable data storage that keeps data across canister upgrades.
 * For the sake of this contract we've chosen {@link StableBTreeMap} as a storage for the next reasons:
 * - `insert`, `get` and `remove` operations have a constant time complexity - O(1)
 * - data stored in the map survives canister upgrades unlike using HashMap where data is stored in the heap and it's lost after the canister is upgraded
 *
 * Brakedown of the `StableBTreeMap(string, food)` datastructure:
 * - the key of map is a `foodId`
 * - the value in this map is a food itself `food` that is related to a given key (`foodId`)
 *
 * Constructor values:
 * 1) 0 - memory id where to initialize a map.
 */

/**
 This type represents a food that can be listed on a board.
 */
class Food {
    id: string;
    name: string;
    type: string;
    price: string;
    createdAt: Date;
    updatedAt: Date | null
}

const foodsStorage = StableBTreeMap<string, Food>(0);

export default Server(() => {
    const app = express();
    app.use(express.json());

    app.post("/foods", (req, res) => {
        const food: Food = { id: uuidv4(), createdAt: getCurrentDate(), ...req.body };
        foodsStorage.insert(food.id, food);
        res.json(food);
    });

    app.get("/foods", (req, res) => {
        res.json(foodsStorage.values());
    });

    app.get("/foods/:id", (req, res) => {
        const foodId = req.params.id;
        const foodOpt = foodsStorage.get(foodId);
        if ("None" in foodOpt) {
            res.status(404).send(`the food with id=${foodId} not found`);
        } else {
            res.json(foodOpt.Some);
        }
    });

    app.put("/foods/:id", (req, res) => {
        const foodId = req.params.id;
        const foodOpt = foodsStorage.get(foodId);
        if ("None" in foodOpt) {
            res.status(400).send(`couldn't update a food with id=${foodId}. food not found`);
        } else {
            const food = foodOpt.Some;
            const updatedfood = { ...food, ...req.body, updatedAt: getCurrentDate() };
            foodsStorage.insert(food.id, updatedfood);
            res.json(updatedfood);
        }
    });

    app.delete("/foods/:id", (req, res) => {
        const foodId = req.params.id;
        const deletedfood = foodsStorage.remove(foodId);
        if ("None" in deletedfood) {
            res.status(400).send(`couldn't delete a food with id=${foodId}. food not found`);
        } else {
            res.json(deletedfood.Some);
        }
    });

    return app.listen();
});

function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}