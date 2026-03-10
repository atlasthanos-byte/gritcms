package middleware

import (
	"bytes"
	"io"
	"strings"

	"github.com/gin-gonic/gin"
)

// WAFBypassBuffer buffers request bodies for routes that contain HTML content
// (campaigns, templates, pages, posts) so the WAF doesn't flag them as XSS.
// Call this BEFORE sentinel.Mount(). Pair with WAFBypassRestore() AFTER.
func WAFBypassBuffer(prefixes []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			path := c.Request.URL.Path
			for _, prefix := range prefixes {
				if strings.HasPrefix(path, prefix) {
					bodyBytes, err := io.ReadAll(c.Request.Body)
					c.Request.Body.Close()
					if err == nil && len(bodyBytes) > 0 {
						c.Set("_waf_bypass_body", bodyBytes)
						c.Request.Body = io.NopCloser(bytes.NewReader([]byte("{}")))
						c.Request.ContentLength = 2
					}
					break
				}
			}
		}
		c.Next()
	}
}

// WAFBypassRestore restores the original request body after the WAF has run.
// Use this on route groups whose handlers need the original body.
func WAFBypassRestore() gin.HandlerFunc {
	return func(c *gin.Context) {
		if bodyBytes, ok := c.Get("_waf_bypass_body"); ok {
			b := bodyBytes.([]byte)
			c.Request.Body = io.NopCloser(bytes.NewReader(b))
			c.Request.ContentLength = int64(len(b))
		}
		c.Next()
	}
}
