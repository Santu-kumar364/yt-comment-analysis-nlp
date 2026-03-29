package com.backend.controller;

import org.springframework.web.bind.annotation.*;

import com.backend.model.Comment;
import com.backend.service.CommentService;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin("*")
public class CommentController {

    private final CommentService service;

    public CommentController(CommentService service) {
        this.service = service;
    }

    @PostMapping("/analyze")
    public Comment analyze(@RequestBody Comment request) {
        if (request.getText() == null || request.getText().trim().isEmpty()) {
            throw new RuntimeException("Comment cannot be empty");
        }
        return service.analyze(request.getText());
    }

    @GetMapping("/comments")
    public List<Comment> getAll() {
        return service.getAll();
    }

    @DeleteMapping("/comments")
    public String deleteAll() {
        service.deleteAll();
        return "All comments deleted";
    }

    @GetMapping("/analyze_youtube")
    public List<Comment> analyzeYouTube(@RequestParam String url,
                                        @RequestParam(defaultValue = "50") int limit) {
        return service.analyzeYouTube(url, limit);
    }
}