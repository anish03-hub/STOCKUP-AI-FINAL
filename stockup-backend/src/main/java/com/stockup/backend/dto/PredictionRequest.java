package com.stockup.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for demand prediction.
 * Contains all features required by the trained Random Forest model.
 * Feature names match exactly what the model expects.
 */
public class PredictionRequest {

    // Features from the Walmart dataset used in training
    // Names must match exactly what the model expects
    
    @NotNull(message = "Store is required")
    @JsonProperty("Store")
    private Integer Store;

    @NotNull(message = "Dept is required")
    @JsonProperty("Dept")
    private Integer Dept;

    @NotNull(message = "IsHoliday is required")
    @JsonProperty("IsHoliday")
    private Integer IsHoliday; // 0 or 1

    @NotNull(message = "Temperature is required")
    @JsonProperty("Temperature")
    private Double Temperature;

    @NotNull(message = "Fuel_Price is required")
    @JsonProperty("Fuel_Price")
    private Double Fuel_Price;

    @NotNull(message = "MarkDown1 is required")
    @JsonProperty("MarkDown1")
    private Double MarkDown1;

    @NotNull(message = "MarkDown2 is required")
    @JsonProperty("MarkDown2")
    private Double MarkDown2;

    @NotNull(message = "MarkDown3 is required")
    @JsonProperty("MarkDown3")
    private Double MarkDown3;

    @NotNull(message = "MarkDown4 is required")
    @JsonProperty("MarkDown4")
    private Double MarkDown4;

    @NotNull(message = "MarkDown5 is required")
    @JsonProperty("MarkDown5")
    private Double MarkDown5;

    @NotNull(message = "CPI is required")
    @JsonProperty("CPI")
    private Double CPI;

    @NotNull(message = "Unemployment is required")
    @JsonProperty("Unemployment")
    private Double Unemployment;

    @NotNull(message = "Size is required")
    @JsonProperty("Size")
    private Double Size;

    @NotNull(message = "Year is required")
    @JsonProperty("Year")
    private Integer Year;

    @NotNull(message = "Month is required")
    @JsonProperty("Month")
    private Integer Month;

    @NotNull(message = "Week is required")
    @JsonProperty("Week")
    private Integer Week;

    @NotNull(message = "Day is required")
    @JsonProperty("Day")
    private Integer Day;

    @NotNull(message = "Quarter is required")
    @JsonProperty("Quarter")
    private Integer Quarter;

    @NotNull(message = "Type_B is required")
    @JsonProperty("Type_B")
    private Integer Type_B; // 0 or 1 (one-hot encoded)

    @NotNull(message = "Type_C is required")
    @JsonProperty("Type_C")
    private Integer Type_C; // 0 or 1 (one-hot encoded)

    // Getters and Setters
    public Integer getStore() {
        return Store;
    }

    public void setStore(Integer store) {
        Store = store;
    }

    public Integer getDept() {
        return Dept;
    }

    public void setDept(Integer dept) {
        Dept = dept;
    }

    public Integer getIsHoliday() {
        return IsHoliday;
    }

    public void setIsHoliday(Integer isHoliday) {
        IsHoliday = isHoliday;
    }

    public Double getTemperature() {
        return Temperature;
    }

    public void setTemperature(Double temperature) {
        Temperature = temperature;
    }

    public Double getFuelPrice() {
        return Fuel_Price;
    }

    public void setFuelPrice(Double fuelPrice) {
        Fuel_Price = fuelPrice;
    }

    public Double getMarkDown1() {
        return MarkDown1;
    }

    public void setMarkDown1(Double markDown1) {
        MarkDown1 = markDown1;
    }

    public Double getMarkDown2() {
        return MarkDown2;
    }

    public void setMarkDown2(Double markDown2) {
        MarkDown2 = markDown2;
    }

    public Double getMarkDown3() {
        return MarkDown3;
    }

    public void setMarkDown3(Double markDown3) {
        MarkDown3 = markDown3;
    }

    public Double getMarkDown4() {
        return MarkDown4;
    }

    public void setMarkDown4(Double markDown4) {
        MarkDown4 = markDown4;
    }

    public Double getMarkDown5() {
        return MarkDown5;
    }

    public void setMarkDown5(Double markDown5) {
        MarkDown5 = markDown5;
    }

    public Double getCpi() {
        return CPI;
    }

    public void setCpi(Double cpi) {
        CPI = cpi;
    }

    public Double getUnemployment() {
        return Unemployment;
    }

    public void setUnemployment(Double unemployment) {
        Unemployment = unemployment;
    }

    public Double getSize() {
        return Size;
    }

    public void setSize(Double size) {
        Size = size;
    }

    public Integer getYear() {
        return Year;
    }

    public void setYear(Integer year) {
        Year = year;
    }

    public Integer getMonth() {
        return Month;
    }

    public void setMonth(Integer month) {
        Month = month;
    }

    public Integer getWeek() {
        return Week;
    }

    public void setWeek(Integer week) {
        Week = week;
    }

    public Integer getDay() {
        return Day;
    }

    public void setDay(Integer day) {
        Day = day;
    }

    public Integer getQuarter() {
        return Quarter;
    }

    public void setQuarter(Integer quarter) {
        Quarter = quarter;
    }

    public Integer getTypeB() {
        return Type_B;
    }

    public void setTypeB(Integer typeB) {
        Type_B = typeB;
    }

    public Integer getTypeC() {
        return Type_C;
    }

    public void setTypeC(Integer typeC) {
        Type_C = typeC;
    }
}
