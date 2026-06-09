package com.teamarc.planit.repository;

import com.teamarc.planit.entity.User;
import com.teamarc.planit.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    User findByRole(UserRole role);
}

