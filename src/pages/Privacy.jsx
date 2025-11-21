import React from 'react'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import PageContainer from '../components/PageContainer'

export default function Privacy() {
  return (
    <PageContainer maxWidth={960}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          borderRadius: 2,
          width: '100%'
        }}
      >
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
        }}
      >
        Privacy Policy
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          mb: { xs: 3, sm: 4 },
          fontSize: { xs: '0.8rem', sm: '0.875rem' }
        }}
      >
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </Typography>

      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          At TCG ID, we are committed to protecting your privacy and ensuring the security of your personal information. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
          website and services, including when you connect your eBay account through our OAuth integration.
        </Typography>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          1. Information We Collect
        </Typography>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          We collect information that you provide directly to us and information that we obtain automatically when you 
          use our services:
        </Typography>
        <Typography 
          variant="body1" 
          component="div" 
          sx={{ 
            pl: { xs: 1, sm: 2 },
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          <Typography 
            variant="body1" 
            paragraph
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              lineHeight: 1.6
            }}
          >
            <strong>Account Information:</strong> When you create an account, we collect your email address, username, 
            and any other information you choose to provide.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              lineHeight: 1.6
            }}
          >
            <strong>eBay Account Data:</strong> When you connect your eBay account through OAuth, we may access and 
            store certain information from your eBay account, including but not limited to:
          </Typography>
          <Box 
            component="ul" 
            sx={{ 
              pl: { xs: 2, sm: 3 }, 
              mb: 2,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            <li>Your eBay user ID and username</li>
            <li>Account preferences and settings</li>
            <li>Listing data (if authorized)</li>
            <li>Other information made available through the eBay API</li>
          </Box>
          <Typography 
            variant="body1" 
            paragraph
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              lineHeight: 1.6
            }}
          >
            <strong>Usage Information:</strong> We automatically collect information about how you interact with our 
            services, including your IP address, browser type, device information, and usage patterns.
          </Typography>
        </Typography>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          2. How We Use Your Information
        </Typography>
        <Typography 
          variant="body1" 
          component="div"
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          <Typography 
            variant="body1" 
            paragraph
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              lineHeight: 1.6
            }}
          >
            We use the information we collect to:
          </Typography>
          <Box 
            component="ul" 
            sx={{ 
              pl: { xs: 2, sm: 3 }, 
              mb: 2,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            <li>Provide, maintain, and improve our services</li>
            <li>Process and manage your account and eBay account integration</li>
            <li>Communicate with you about your account and our services</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
            <li>Comply with legal obligations and enforce our terms of service</li>
          </Box>
        </Typography>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          3. Third-Party Services
        </Typography>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          <strong>eBay Integration:</strong> Our service integrates with eBay through OAuth authentication. When you 
          connect your eBay account, you authorize us to access certain information from your eBay account. This 
          integration is governed by eBay's terms of service and privacy policy. We only access and use eBay data 
          as necessary to provide our services and as authorized by you.
        </Typography>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          We do not sell, rent, or trade your personal information to third parties. We may share your information 
          only in the following circumstances:
        </Typography>
        <Box 
          component="ul" 
          sx={{ 
            pl: { xs: 2, sm: 3 }, 
            mb: 2,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          <li>With your explicit consent</li>
          <li>To comply with legal obligations or respond to lawful requests</li>
          <li>To protect our rights, privacy, safety, or property</li>
          <li>With service providers who assist us in operating our services (under strict confidentiality agreements)</li>
        </Box>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          4. Data Security
        </Typography>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          We implement appropriate technical and organizational measures to protect your personal information against 
          unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the 
          internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
        </Typography>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          5. Your Rights and Choices
        </Typography>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          You have the right to:
        </Typography>
        <Box 
          component="ul" 
          sx={{ 
            pl: { xs: 2, sm: 3 }, 
            mb: 2,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          <li>Access, update, or delete your personal information</li>
          <li>Disconnect your eBay account at any time</li>
          <li>Opt-out of certain communications from us</li>
          <li>Request a copy of your data</li>
          <li>File a complaint with relevant data protection authorities</li>
        </Box>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
        </Typography>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          6. Cookies and Tracking Technologies
        </Typography>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          We use cookies and similar tracking technologies to collect and store information about your preferences 
          and interactions with our services. You can control cookie settings through your browser preferences, though 
          disabling cookies may limit some functionality of our services.
        </Typography>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          7. Children's Privacy
        </Typography>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          Our services are not intended for individuals under the age of 18. We do not knowingly collect personal 
          information from children. If you believe we have collected information from a child, please contact us 
          immediately.
        </Typography>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          8. Changes to This Privacy Policy
        </Typography>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
          the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our 
          services after such changes constitutes your acceptance of the updated Privacy Policy.
        </Typography>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          9. Contact Us
        </Typography>
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.6
          }}
        >
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please 
          contact us at:
        </Typography>
        <Typography 
          variant="body1" 
          paragraph 
          sx={{ 
            pl: { xs: 1, sm: 2 },
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          <strong>Email:</strong> privacy@tcgid.io
        </Typography>
        <Typography 
          variant="body1" 
          paragraph 
          sx={{ 
            pl: { xs: 1, sm: 2 },
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          <strong>Website:</strong> https://tcgid.io
        </Typography>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          paragraph
          sx={{
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          By using our services, you acknowledge that you have read and understood this Privacy Policy and agree to 
          the collection and use of your information as described herein.
        </Typography>
      </Box>
      </Paper>
    </PageContainer>
  )
}
