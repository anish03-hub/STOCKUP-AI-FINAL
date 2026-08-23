package com.stockup.backend.service.impl;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.stockup.backend.dto.ItemDTO;
import com.stockup.backend.dto.ItemImportResult;
import com.stockup.backend.exception.ResourceNotFoundException;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ItemRepository;
import com.stockup.backend.service.ItemService;
import org.springframework.lang.NonNull;

@Service
public class ItemServiceImpl implements ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @NonNull
    private Item mapToEntity(@NonNull ItemDTO dto) {
        return new Item(
            dto.getId(),
            dto.getName(),
            dto.getCode(),
            dto.getCategory(),
            dto.getManufacturer(),
            dto.getDescription(),
            dto.getPrice(),
            dto.getSellingPrice(),
            dto.getQuantity(),
            dto.getExpiryDate(),
            dto.getStatus()
        );
    }

    private ItemDTO mapToDTO(Item item) {
        return new ItemDTO(
            item.getId(),
            item.getName(),
            item.getCode(),
            item.getCategory(),
            item.getManufacturer(),
            item.getDescription(),
            item.getPrice(),
            item.getSellingPrice(),
            item.getQuantity(),
            item.getExpiryDate(),
            item.getStatus()
        );
    }

    @Override
    public ItemDTO createItem(@NonNull ItemDTO itemDTO) {
        Item item = mapToEntity(itemDTO);
        Item savedItem = itemRepository.save(item);
        return mapToDTO(savedItem);
    }

    @Override
    public ItemDTO getItemById(@NonNull String id) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        return mapToDTO(item);
    }

    @Override
    public List<ItemDTO> getAllItems() {
        List<Item> items = itemRepository.findAll();
        return items.stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public ItemDTO updateItem(@NonNull String id, @NonNull ItemDTO itemDTO) {
        Item existingItem = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        existingItem.setName(itemDTO.getName());
        existingItem.setCode(itemDTO.getCode());
        existingItem.setCategory(itemDTO.getCategory());
        existingItem.setManufacturer(itemDTO.getManufacturer());
        existingItem.setDescription(itemDTO.getDescription());
        existingItem.setPrice(itemDTO.getPrice());
        existingItem.setSellingPrice(itemDTO.getSellingPrice());
        existingItem.setQuantity(itemDTO.getQuantity());
        existingItem.setExpiryDate(itemDTO.getExpiryDate());
        existingItem.setStatus(itemDTO.getStatus());

        Item updatedItem = itemRepository.save(existingItem);
        return mapToDTO(updatedItem);
    }

    @Override
    @SuppressWarnings("null")
    public void deleteItem(@NonNull String id) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        itemRepository.delete(item);
    }

    @Override
    public ItemImportResult importFromCsv(MultipartFile file) {
        ItemImportResult result = new ItemImportResult(0, 0, 0, 0, new ArrayList<>());
        if (file == null || file.isEmpty()) {
            result.getErrors().add("File is empty or not provided.");
            return result;
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                result.getErrors().add("File does not contain a header line.");
                return result;
            }

            // Parse headers
            List<String> headers = Arrays.stream(headerLine.split(","))
                    .map(s -> s == null ? "" : s.trim())
                    .map(s -> s.toLowerCase())
                    .collect(Collectors.toList());

            // Validate required columns
            int nameIdx = headers.indexOf("name");
            int codeIdx = headers.indexOf("code");
            int priceIdx = headers.indexOf("price");
            int quantityIdx = headers.indexOf("quantity");
            int expiryDateIdx = headers.indexOf("expirydate");

            if (nameIdx == -1 || codeIdx == -1 || priceIdx == -1 || quantityIdx == -1 || expiryDateIdx == -1) {
                result.getErrors().add("Missing required columns: name, code, price, quantity, expiryDate are mandatory.");
                return result;
            }

            // Other optional indexes
            int categoryIdx = headers.indexOf("category");
            int descriptionIdx = headers.indexOf("description");
            int manufacturerIdx = headers.indexOf("manufacturer");
            int sellingPriceIdx = headers.indexOf("sellingprice");
            int statusIdx = headers.indexOf("status");

            String line;
            int rowNum = 1; // header is row 1
            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (line.trim().isEmpty()) {
                    result.setSkipped(result.getSkipped() + 1);
                    continue;
                }

                String[] columns = line.split(",", -1);
                result.setTotalRecords(result.getTotalRecords() + 1);

                if (columns.length < Math.max(nameIdx, Math.max(codeIdx, Math.max(priceIdx, Math.max(quantityIdx, expiryDateIdx)))) + 1) {
                    result.getErrors().add(String.format("Row %d: Insufficient number of columns.", rowNum));
                    continue;
                }

                String name = columns[nameIdx].trim();
                String code = columns[codeIdx].trim();
                String priceStr = columns[priceIdx].trim();
                String quantityStr = columns[quantityIdx].trim();
                String expiryDateStr = columns[expiryDateIdx].trim();

                // Validation: non-empty required fields
                if (name.isEmpty() || code.isEmpty() || priceStr.isEmpty() || quantityStr.isEmpty() || expiryDateStr.isEmpty()) {
                    result.getErrors().add(String.format("Row %d: Required fields (name, code, price, quantity, expiryDate) cannot be empty.", rowNum));
                    continue;
                }

                // Validation: product codes
                if (code.length() < 2) {
                    result.getErrors().add(String.format("Row %d: Code '%s' is too short.", rowNum, code));
                    continue;
                }

                // Validation: numeric fields
                Double price;
                try {
                    price = Double.parseDouble(priceStr);
                    if (price <= 0) {
                        result.getErrors().add(String.format("Row %d: Price must be positive.", rowNum));
                        continue;
                    }
                } catch (NumberFormatException e) {
                    result.getErrors().add(String.format("Row %d: Price '%s' is not a valid number.", rowNum, priceStr));
                    continue;
                }

                Integer quantity;
                try {
                    quantity = Integer.parseInt(quantityStr);
                    if (quantity < 0) {
                        result.getErrors().add(String.format("Row %d: Quantity must be non-negative.", rowNum));
                        continue;
                    }
                } catch (NumberFormatException e) {
                    result.getErrors().add(String.format("Row %d: Quantity '%s' is not a valid integer.", rowNum, quantityStr));
                    continue;
                }

                // Validation: Date
                LocalDate parsedDate = parseDateSafely(expiryDateStr);
                if (parsedDate == null) {
                    result.getErrors().add(String.format("Row %d: Expiry date '%s' is not in a valid format (YYYY-MM-DD or M/d/yyyy).", rowNum, expiryDateStr));
                    continue;
                }

                // Optional fields
                String category = categoryIdx != -1 && categoryIdx < columns.length ? columns[categoryIdx].trim() : "";
                String description = descriptionIdx != -1 && descriptionIdx < columns.length ? columns[descriptionIdx].trim() : "";
                String manufacturer = manufacturerIdx != -1 && manufacturerIdx < columns.length ? columns[manufacturerIdx].trim() : "";
                
                Double sellingPrice = price; // Default to purchase price
                if (sellingPriceIdx != -1 && sellingPriceIdx < columns.length && !columns[sellingPriceIdx].trim().isEmpty()) {
                    try {
                        sellingPrice = Double.parseDouble(columns[sellingPriceIdx].trim());
                        if (sellingPrice < 0) {
                            result.getErrors().add(String.format("Row %d: Selling price must be non-negative.", rowNum));
                            continue;
                        }
                    } catch (NumberFormatException e) {
                        result.getErrors().add(String.format("Row %d: Selling price '%s' is not a valid number.", rowNum, columns[sellingPriceIdx]));
                        continue;
                    }
                }

                String status = statusIdx != -1 && statusIdx < columns.length ? columns[statusIdx].trim() : "In Stock";
                if (status.isEmpty()) {
                    status = "In Stock";
                }

                // Check for duplicates / upsert
                Optional<Item> existingItemOpt = itemRepository.findByCodeIgnoreCase(code);
                if (existingItemOpt.isPresent()) {
                    Item existingItem = existingItemOpt.get();
                    existingItem.setName(name);
                    existingItem.setCategory(category);
                    existingItem.setDescription(description);
                    existingItem.setManufacturer(manufacturer);
                    existingItem.setPrice(price);
                    existingItem.setSellingPrice(sellingPrice);
                    existingItem.setQuantity(quantity);
                    existingItem.setExpiryDate(expiryDateStr);
                    existingItem.setStatus(status);
                    itemRepository.save(existingItem);
                    result.setUpdated(result.getUpdated() + 1);
                } else {
                    Item newItem = new Item(
                            null,
                            name,
                            code,
                            category,
                            manufacturer,
                            description,
                            price,
                            sellingPrice,
                            quantity,
                            expiryDateStr,
                            status
                    );
                    itemRepository.save(newItem);
                    result.setImported(result.getImported() + 1);
                }
            }

        } catch (IOException e) {
            result.getErrors().add("Failed to process CSV file: " + e.getMessage());
        }

        return result;
    }

    private LocalDate parseDateSafely(String dateStr) {
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException e) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M/d/yyyy");
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException ex) {
                return null;
            }
        }
    }
}