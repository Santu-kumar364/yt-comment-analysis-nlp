package com.backend.repository;

import java.util.List;

import com.backend.model.Comment;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
     
    List<Comment> findAllByOrderByCreatedAtDesc();
}

