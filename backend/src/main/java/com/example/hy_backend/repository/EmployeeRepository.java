package com.example.hy_backend.repository;

import com.example.hy_backend.model.Employee;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, String> {
    Optional<Employee> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<Employee> findAllByOrderByCreatedAtDesc();

    List<Employee> findByOfficeLocationIgnoreCase(String officeLocation);
}
