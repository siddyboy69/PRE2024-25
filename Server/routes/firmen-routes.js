"use strict";
const express = require("express");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { Firma } = require("../model/firmen");

const firmenRouter = express.Router();
exports.firmenRouter = firmenRouter;

// Example JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "s3cureP@ssW0rd12345!";

// Middleware to verify token (similar to your other routes)
function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (typeof authHeader !== "string") {
        res.status(403).send({ message: "No token provided!" });
        return;
    }

    const parts = authHeader.split(" ");
    const actualToken = parts[1];
    if (!actualToken) {
        res.status(403).send({ message: "No token provided!" });
        return;
    }

    jwt.verify(actualToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).send({ message: "Unauthorized!" });
            return;
        }
        req.userId = decoded.id;
        next();
    });
}

// === CREATE a new Firma (POST /firmen) ===
firmenRouter.post("/", verifyToken, (req, res, next) => {
    const { bezeichnung } = req.body;

    if (!bezeichnung) {
        res.status(400).send({ message: "Missing bezeichnung" });
        return;
    }

    const sql = `INSERT INTO firma (bezeichnung) VALUES (?)`;

    pool.query(sql, [bezeichnung], (err, result) => {
        if (err) {
            console.error("Error creating firma:", err);
            res.status(500).send({ message: "Error creating firma" });
            return;
        }

        // Respond with 201 Created
        res.status(201).send({
            message: "Firma created successfully",
            firmaId: result.insertId,
            bezeichnung,
        });
    });
});

// === READ all Firmen (GET /firmen) ===
firmenRouter.get("/", verifyToken, (req, res) => {
    const sql = "SELECT * FROM firma ORDER BY bezeichnung ASC";

    pool.query(sql, (err, rows) => {
        if (err) {
            console.error("Error fetching Firmen:", err);
            res.status(500).send({ message: "Error fetching Firmen" });
            return;
        }

        // Convert each row to a Firma model instance if desired
        const result = rows.map((row) => new Firma(row.id, row.bezeichnung));
        res.status(200).send(result);
    });
});

// === READ single Firma by ID (GET /firmen/:id) ===
firmenRouter.get("/:id", verifyToken, (req, res) => {
    const firmaId = parseInt(req.params.id, 10);
    if (!firmaId) {
        res.status(400).send({ message: "Invalid ID" });
        return;
    }

    const sql = "SELECT * FROM firma WHERE id = ?";
    pool.query(sql, [firmaId], (err, rows) => {
        if (err) {
            console.error("Error fetching firma:", err);
            res.status(500).send({ message: "Error fetching firma" });
            return;
        }
        if (rows.length === 0) {
            res.status(404).send({ message: "Firma not found" });
            return;
        }

        const row = rows[0];
        const firma = new Firma(row.id, row.bezeichnung);
        res.status(200).send(firma);
    });
});

// === UPDATE Firma by ID (PUT /firmen/:id) ===
firmenRouter.put("/:id", verifyToken, (req, res) => {
    const firmaId = parseInt(req.params.id, 10);
    const { bezeichnung } = req.body;

    if (!firmaId || !bezeichnung) {
        res.status(400).send({ message: "Invalid input" });
        return;
    }

    const sql = `
    UPDATE firma
    SET bezeichnung = ?
    WHERE id = ?;
  `;
    pool.query(sql, [bezeichnung, firmaId], (err) => {
        if (err) {
            console.error("Error updating firma:", err);
            res.status(500).send({ message: "Error updating firma" });
            return;
        }
        res.status(200).send({ message: "Firma updated successfully" });
    });
});

// === DELETE Firma by ID (DELETE /firmen/:id) ===
firmenRouter.delete("/:id", verifyToken, (req, res) => {
    const firmaId = parseInt(req.params.id, 10);
    if (!firmaId) {
        res.status(400).send({ message: "Invalid ID" });
        return;
    }

    const sql = "DELETE FROM firma WHERE id = ?";
    pool.query(sql, [firmaId], (err, result) => {
        if (err) {
            console.error("Error deleting firma:", err);
            res.status(500).send({ message: "Error deleting firma" });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).send({
                message: "Firma not found or already deleted",
            });
            return;
        }
        res.status(200).send({ message: "Firma deleted successfully" });
    });
});
