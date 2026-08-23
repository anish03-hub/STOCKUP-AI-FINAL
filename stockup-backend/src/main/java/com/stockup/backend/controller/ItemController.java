package com.stockup.backend.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;

import com.stockup.backend.dto.ItemDTO;
import com.stockup.backend.dto.ItemImportResult;
import com.stockup.backend.service.ItemService;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ItemController {

    @Autowired
    private ItemService itemService;

    @PostMapping
    public ResponseEntity<ItemDTO> createItem(@Valid @RequestBody @NonNull ItemDTO itemDTO) {
        ItemDTO createdItem = itemService.createItem(itemDTO);
        return new ResponseEntity<>(createdItem, HttpStatus.CREATED);
    }

    @PostMapping("/import")
    public ResponseEntity<ItemImportResult> importItems(@RequestParam("file") MultipartFile file) {
        ItemImportResult result = itemService.importFromCsv(file);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemDTO> getItemById(@PathVariable @NonNull String id) {
        ItemDTO item = itemService.getItemById(id);
        return new ResponseEntity<>(item, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<ItemDTO>> getAllItems() {
        List<ItemDTO> items = itemService.getAllItems();
        return new ResponseEntity<>(items, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemDTO> updateItem(@PathVariable @NonNull String id, @Valid @RequestBody @NonNull ItemDTO itemDTO) {
        ItemDTO updatedItem = itemService.updateItem(id, itemDTO);
        return new ResponseEntity<>(updatedItem, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable @NonNull String id) {
        itemService.deleteItem(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}