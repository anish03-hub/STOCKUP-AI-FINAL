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
        userRepository.findByEmailIgnoreCase("ag584160@gmail.com").ifPresent(user -> {
            boolean updated = false;
            if (!"BOTH".equalsIgnoreCase(user.getAuthProvider())) {
                user.setAuthProvider("BOTH");
                updated = true;
            }
            if (user.getPassword() == null || !passwordEncoder.matches(adminPassword, user.getPassword())) {
                user.setPassword(passwordEncoder.encode(adminPassword));
                updated = true;
            }
            if (updated) {
                userRepository.save(user);
                logger.info("Synchronized credentials and BOTH auth provider for target admin account.");
            }
        });

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
