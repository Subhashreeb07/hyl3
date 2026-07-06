package com.example.hy_backend.repository;

import com.example.hy_backend.model.FieldOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FieldOptionRepository extends JpaRepository<FieldOption, Long> {
    List<FieldOption> findByFieldFieldIdOrderByDisplayOrderAsc(Long fieldId);
}
