package com.stockup.backend.service;

import com.stockup.backend.dto.MedicineDemandPredictionRequest;
import com.stockup.backend.dto.MedicineDemandPredictionResponse;
import com.stockup.backend.exception.InvalidMedicineProductCodeException;
import com.stockup.backend.exception.MedicineDemandPredictionException;
import com.stockup.backend.service.impl.MedicineDemandPredictionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@SuppressWarnings("null")
public class MedicineDemandPredictionServiceTest {

    private static final String MEDICINE_DEMAND_URL = "http://localhost:8001/medicine-demand/predict";

    private MedicineDemandPredictionServiceImpl service;
    private MockRestServiceServer mockServer;

    @BeforeEach
    public void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.createServer(restTemplate);
        service = new MedicineDemandPredictionServiceImpl(restTemplate);
        ReflectionTestUtils.setField(service, "mlApiUrl", "http://localhost:8001");
    }

    @Test
    public void testValidN02BERequest() {
        mockServer.expect(once(), requestTo(MEDICINE_DEMAND_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"product_code\":\"N02BE\"}"))
                .andRespond(withSuccess("""
                        {
                          "product_code": "N02BE",
                          "latest_timestamp": "2019-10-08T19:00:00",
                          "latest_observed_demand": 8.0,
                          "predicted_next_hour_demand": 3.4474
                        }
                        """, org.springframework.http.MediaType.APPLICATION_JSON));

        MedicineDemandPredictionResponse response =
                service.predictMedicineDemand(new MedicineDemandPredictionRequest("N02BE"));

        assertEquals("N02BE", response.getProductCode());
        assertEquals("2019-10-08T19:00:00", response.getLatestTimestamp());
        assertEquals(8.0, response.getLatestObservedDemand(), 0.0001);
        assertEquals(3.4474, response.getPredictedNextHourDemand(), 0.0001);
        mockServer.verify();
    }

    @Test
    public void testValidM01ABRequest() {
        mockServer.expect(once(), requestTo(MEDICINE_DEMAND_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"product_code\":\"M01AB\"}"))
                .andRespond(withSuccess("""
                        {
                          "product_code": "M01AB",
                          "latest_timestamp": "2019-10-08T19:00:00",
                          "latest_observed_demand": 0.0,
                          "predicted_next_hour_demand": 0.3417
                        }
                        """, org.springframework.http.MediaType.APPLICATION_JSON));

        MedicineDemandPredictionResponse response =
                service.predictMedicineDemand(new MedicineDemandPredictionRequest("M01AB"));

        assertEquals("M01AB", response.getProductCode());
        assertEquals("2019-10-08T19:00:00", response.getLatestTimestamp());
        assertEquals(0.0, response.getLatestObservedDemand(), 0.0001);
        assertEquals(0.3417, response.getPredictedNextHourDemand(), 0.0001);
        mockServer.verify();
    }

    @Test
    public void testInvalidProductCode() {
        InvalidMedicineProductCodeException exception = assertThrows(
                InvalidMedicineProductCodeException.class,
                () -> service.predictMedicineDemand(new MedicineDemandPredictionRequest("BAD_CODE"))
        );

        assertEquals(
                "Unsupported product code: BAD_CODE. Supported codes are: M01AB, M01AE, N02BA, N02BE, N05B, N05C, R03, R06",
                exception.getMessage()
        );
    }

    @Test
    public void testFastApiErrorScenario() {
        mockServer.expect(once(), requestTo(MEDICINE_DEMAND_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"product_code\":\"N02BE\"}"))
                .andRespond(withServerError());

        MedicineDemandPredictionException exception = assertThrows(
                MedicineDemandPredictionException.class,
                () -> service.predictMedicineDemand(new MedicineDemandPredictionRequest("N02BE"))
        );

        assertEquals(HttpStatus.BAD_GATEWAY, exception.getStatus());
        assertEquals("Medicine demand service returned an error", exception.getMessage());
        mockServer.verify();
    }
}
