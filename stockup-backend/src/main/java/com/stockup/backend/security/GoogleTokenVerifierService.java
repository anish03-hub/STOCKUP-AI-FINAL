package com.stockup.backend.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;

@Slf4j
@Service
public class GoogleTokenVerifierService {

    @Value("${application.security.google.client-id:}")
    private String googleClientId;

    public GoogleIdToken.Payload verifyToken(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new IllegalArgumentException("Google token credential cannot be null or empty.");
        }

        try {
            NetHttpTransport transport = new NetHttpTransport();
            GsonFactory jsonFactory = GsonFactory.getDefaultInstance();

            GoogleIdTokenVerifier.Builder verifierBuilder = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                    .setIssuers(Arrays.asList("https://accounts.google.com", "accounts.google.com"));

            String targetClientId = (googleClientId != null) ? googleClientId.trim() : "";
            if (!targetClientId.isBlank()) {
                verifierBuilder.setAudience(Collections.singletonList(targetClientId));
            } else {
                log.warn("GOOGLE_CLIENT_ID is not configured. Token signature and issuer will be verified, but audience match check is skipped.");
            }

            GoogleIdTokenVerifier verifier = verifierBuilder.build();
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                try {
                    GoogleIdToken unverifiedToken = GoogleIdToken.parse(jsonFactory, idTokenString);
                    if (unverifiedToken != null && unverifiedToken.getPayload() != null) {
                        GoogleIdToken.Payload p = unverifiedToken.getPayload();
                        log.warn("Google ID Token verification failed. Safe Diagnostic -> Configured ClientID Length: {}, Token Audience: {}, Token Issuer: {}, Token Expired: {}",
                                targetClientId.length(),
                                p.getAudienceAsList(),
                                p.getIssuer(),
                                p.getExpirationTimeSeconds() != null && p.getExpirationTimeSeconds() < (System.currentTimeMillis() / 1000));
                    }
                } catch (Exception parseEx) {
                    log.warn("Could not parse unverified token payload for diagnostic logging: {}", parseEx.getMessage());
                }
                throw new IllegalArgumentException("Invalid Google ID Token (verification failed).");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            Boolean emailVerified = payload.getEmailVerified();
            if (emailVerified != null && !emailVerified) {
                throw new IllegalArgumentException("Google account email address is not verified.");
            }

            return payload;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification failed: {}", e.getMessage());
            throw new IllegalArgumentException("Failed to verify Google ID Token: " + e.getMessage(), e);
        }
    }
}
