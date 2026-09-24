package com.stockup.backend.config;

import com.stockup.backend.model.User;
import com.stockup.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds default administrator accounts on first boot if the users table is empty
 * and synchronizes credentials for existing ADMIN accounts supporting BOTH authentication methods.
 */
@Component
public class UserDataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(UserDataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${stockup.auth.admin-password:${STOCKUP_ADMIN_PASSWORD:Password123!}}")
    private String adminPassword;

    public UserDataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        // Ensure ag584160@gmail.com has valid local credentials & BOTH auth_provider configured
        User targetUser = userRepository.findByEmailIgnoreCase("ag584160@gmail.com").orElse(null);
        if (targetUser == null) {
            targetUser = new User();
            targetUser.setEmail("ag584160@gmail.com");
            targetUser.setFullName("Anish Sah");
            targetUser.setPhone("+91 98765 43210");
            targetUser.setRole("ADMIN");
            targetUser.setAuthProvider("BOTH");
            targetUser.setBusinessId(com.stockup.backend.service.CompanyOnboardingService.DEFAULT_BUSINESS_ID);
            targetUser.setPassword(passwordEncoder.encode(adminPassword));
            targetUser.setCreatedAt(LocalDateTime.now());
            userRepository.save(targetUser);
            logger.info("Created target admin account ag584160@gmail.com with default credentials and BOTH auth provider.");
        } else {
            boolean updated = false;
            if (!"BOTH".equalsIgnoreCase(targetUser.getAuthProvider())) {
                targetUser.setAuthProvider("BOTH");
                updated = true;
            }
            if (targetUser.getBusinessId() == null || targetUser.getBusinessId().isBlank()) {
                targetUser.setBusinessId(com.stockup.backend.service.CompanyOnboardingService.DEFAULT_BUSINESS_ID);
                updated = true;
            }
            if (targetUser.getRole() == null || targetUser.getRole().isBlank()) {
                targetUser.setRole("ADMIN");
                updated = true;
            }
            if (targetUser.getPassword() == null || targetUser.getPassword().isBlank()) {
                targetUser.setPassword(passwordEncoder.encode(adminPassword));
                updated = true;
            }
            if (updated) {
                userRepository.save(targetUser);
                logger.info("Synchronized metadata for target admin account.");
            }
        }

        if (userRepository.count() > 0) {
            return;
        }

        logger.info("Seeding default administrator users into users table...");

        User fdaTester = new User();
        fdaTester.setEmail("fda_tester@stockup.com");
        fdaTester.setPassword(passwordEncoder.encode("Password123!"));
        fdaTester.setFullName("FDA System Administrator");
        fdaTester.setPhone("+1-800-555-0100");
        fdaTester.setRole("ADMIN");
        fdaTester.setAuthProvider("LOCAL");
        fdaTester.setCreatedAt(LocalDateTime.now());

        User admin = new User();
        admin.setEmail("admin@stockup.com");
        admin.setPassword(passwordEncoder.encode("Password123!"));
        admin.setFullName("StockUp Admin");
        admin.setPhone("+1-800-555-0101");
        admin.setRole("ADMIN");
        admin.setAuthProvider("LOCAL");
        admin.setCreatedAt(LocalDateTime.now());

        userRepository.saveAll(List.of(fdaTester, admin));
        logger.info("Successfully seeded default administrator accounts.");
    }
}
