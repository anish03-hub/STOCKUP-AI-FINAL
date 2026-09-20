package com.stockup.backend.security;

import com.stockup.backend.model.User;
import com.stockup.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public Optional<User> getCurrentUserOptional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        String username = authentication.getName();
        if (username == null || username.trim().isEmpty()) {
            return Optional.empty();
        }
        return userRepository.findByEmail(username);
    }

    public User getCurrentUser() {
        return getCurrentUserOptional()
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found or session invalid."));
    }

    public Optional<String> getCurrentUserBusinessIdOptional() {
        return getCurrentUserOptional().map(User::getBusinessId);
    }

    public String getCurrentUserBusinessId() {
        User user = getCurrentUser();
        if (user.getBusinessId() == null || user.getBusinessId().trim().isEmpty()) {
            throw new AccessDeniedException("User is not assigned to any business company.");
        }
        return user.getBusinessId();
    }

    public String getCurrentUserEmail() {
        return getCurrentUserOptional().map(User::getEmail).orElse("system");
    }
}
