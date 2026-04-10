package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"gritcms/apps/api/internal/ai"
)

// AIHandler handles AI completion endpoints.
type AIHandler struct {
	AI *ai.AI
	DB *gorm.DB
}

// GetConfig returns current AI configuration.
func (h *AIHandler) GetConfig(c *gin.Context) {
	if h.AI == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{
				"code":    "AI_UNAVAILABLE",
				"message": "AI service is not configured",
			},
		})
		return
	}

	cfg := h.AI.GetConfig()
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"provider": cfg.Provider,
			"model":    cfg.Model,
			"endpoint": cfg.Endpoint,
			"enabled":  cfg.Enabled,
		},
	})
}

// UpdateConfig updates AI configuration at runtime.
func (h *AIHandler) UpdateConfig(c *gin.Context) {
	if h.AI == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{
				"code":    "AI_UNAVAILABLE",
				"message": "AI service is not configured",
			},
		})
		return
	}

	var req struct {
		Provider string `json:"provider"`
		APIKey   string `json:"api_key"`
		Model    string `json:"model"`
		Endpoint string `json:"endpoint"`
		Enabled  bool   `json:"enabled"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	h.AI.UpdateConfig(ai.Config{
		Provider: req.Provider,
		APIKey:   req.APIKey,
		Model:    req.Model,
		Endpoint: req.Endpoint,
		Enabled:  req.Enabled,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "AI configuration updated",
	})
}

// ListModels returns available models from the AI provider.
func (h *AIHandler) ListModels(c *gin.Context) {
	if h.AI == nil || !h.AI.IsEnabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{
				"code":    "AI_UNAVAILABLE",
				"message": "AI service is not configured",
			},
		})
		return
	}

	cfg := h.AI.GetConfig()

	// Allow testing different endpoints via query param
	testEndpoint := c.Query("endpoint")
	if testEndpoint != "" {
		cfg.Endpoint = testEndpoint
	}
	// Allow explicit provider override from UI (useful before saving runtime config).
	testProvider := c.Query("provider")
	if testProvider != "" {
		cfg.Provider = testProvider
	}

	// For Ollama, fetch from local endpoint
	if cfg.Provider == "ollama" {
		// Create a temp AI to test the endpoint
		testAI := ai.NewWithConfig(ai.Config{
			Provider: "ollama",
			Endpoint: cfg.Endpoint,
			Enabled:  true,
		})
		models, err := testAI.ListModels(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": gin.H{
					"code":    "AI_ERROR",
					"message": "Failed to fetch models: " + err.Error(),
				},
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": models})
		return
	}

	// For cloud providers, return current model
	c.JSON(http.StatusOK, gin.H{
		"data": []string{cfg.Model},
	})
}

type completionRequest struct {
	Prompt      string  `json:"prompt" binding:"required"`
	MaxTokens   int     `json:"max_tokens"`
	Temperature float64 `json:"temperature"`
}

type chatRequest struct {
	Messages    []ai.Message `json:"messages" binding:"required"`
	MaxTokens   int          `json:"max_tokens"`
	Temperature float64      `json:"temperature"`
}

// Complete handles a single prompt completion.
func (h *AIHandler) Complete(c *gin.Context) {
	if h.AI == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{
				"code":    "AI_UNAVAILABLE",
				"message": "AI service is not configured",
			},
		})
		return
	}

	var req completionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	resp, err := h.AI.Complete(c.Request.Context(), ai.CompletionRequest{
		Prompt:      req.Prompt,
		MaxTokens:   req.MaxTokens,
		Temperature: req.Temperature,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "AI_ERROR",
				"message": "Failed to generate completion: " + err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": resp,
	})
}

// Chat handles a multi-turn conversation.
func (h *AIHandler) Chat(c *gin.Context) {
	if h.AI == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{
				"code":    "AI_UNAVAILABLE",
				"message": "AI service is not configured",
			},
		})
		return
	}

	var req chatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	resp, err := h.AI.Complete(c.Request.Context(), ai.CompletionRequest{
		Messages:    req.Messages,
		MaxTokens:   req.MaxTokens,
		Temperature: req.Temperature,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "AI_ERROR",
				"message": "Failed to generate response: " + err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": resp,
	})
}

// Stream handles a streaming completion via SSE.
func (h *AIHandler) Stream(c *gin.Context) {
	if h.AI == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{
				"code":    "AI_UNAVAILABLE",
				"message": "AI service is not configured",
			},
		})
		return
	}

	var req chatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	err := h.AI.Stream(c.Request.Context(), ai.CompletionRequest{
		Messages:    req.Messages,
		MaxTokens:   req.MaxTokens,
		Temperature: req.Temperature,
	}, func(chunk string) error {
		c.SSEvent("message", chunk)
		c.Writer.Flush()
		return nil
	})

	if err != nil {
		c.SSEvent("error", fmt.Sprintf("Stream error: %v", err))
		c.Writer.Flush()
	}

	c.SSEvent("done", "[DONE]")
	c.Writer.Flush()
}
