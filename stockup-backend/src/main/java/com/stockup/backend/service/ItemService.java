package com.stockup.backend.service;

import java.util.List;

import com.stockup.backend.dto.ItemDTO;
import com.stockup.backend.dto.ItemImportResult;
import org.springframework.lang.NonNull;
import org.springframework.web.multipart.MultipartFile;

public interface ItemService {

    ItemDTO createItem(@NonNull ItemDTO itemDTO);

    ItemDTO getItemById(@NonNull String id);

    List<ItemDTO> getAllItems();

    ItemDTO updateItem(@NonNull String id, @NonNull ItemDTO itemDTO);

    void deleteItem(@NonNull String id);

    ItemImportResult importFromCsv(MultipartFile file);
}