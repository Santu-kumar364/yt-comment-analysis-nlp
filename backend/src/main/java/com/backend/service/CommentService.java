package com.backend.service;

import com.backend.model.Comment;
import com.backend.repository.CommentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;


@Service
public class CommentService {

    private final CommentRepository repo;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ml.service.url}")  // e.g., http://localhost:8000
    private String mlUrl;

    public CommentService(CommentRepository repo) {
        this.repo = repo;
    }

    // --- Manual comment ---
    public Comment analyze(String text) {
        Map<String, String> req = new HashMap<>();
        req.put("text", text);

        String sentiment = "UNKNOWN";

        try {
            Map res = restTemplate.postForObject(mlUrl + "/predict", req, Map.class);
            if (res != null && res.get("sentiment") != null) {
                sentiment = res.get("sentiment").toString();
            }
        } catch (Exception e) {
            System.out.println("ML Service Error: " + e.getMessage());
            sentiment = "ERROR";
        }

        Comment comment = new Comment();
        comment.setText(text);
        comment.setSentiment(sentiment);
        return repo.save(comment);
    }

    // --- YouTube URL ---
    public List<Comment> analyzeYouTube(String videoUrl, int limit) {
        List<Comment> comments = new ArrayList<>();
        try {
            String apiUrl = "http://localhost:8000/analyze_youtube?url=" + videoUrl + "&limit=" + limit;
            ResponseEntity<Map> response = restTemplate.getForEntity(apiUrl, Map.class);

            if (response.getBody() != null && response.getBody().containsKey("results")) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");
                for (Map<String, Object> item : results) {
                    Comment c = new Comment();
                    c.setText((String) item.get("text"));
                    c.setSentiment((String) item.get("sentiment"));
                    comments.add(repo.save(c)); // SAVE EACH COMMENT
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("YouTube ML Error: " + e.getMessage());
        }
        return comments;
    }
    

    public List<Comment> getAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    public void deleteAll() {
        repo.deleteAll();
    }
}
