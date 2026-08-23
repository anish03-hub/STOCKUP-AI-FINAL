package com.stockup.backend.exception;

public class InvalidMedicineProductCodeException extends RuntimeException {

    public InvalidMedicineProductCodeException(String message) {
        super(message);
    }
}
