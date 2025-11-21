import React, { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Tooltip from '@mui/material/Tooltip'

const MARKETPLACE_OPTIONS = [
  { label: 'eBay US', value: 'EBAY_US' },
  { label: 'eBay Motors', value: 'EBAY_MOTORS' },
  { label: 'eBay Canada', value: 'EBAY_CA' },
  { label: 'eBay UK', value: 'EBAY_GB' },
  { label: 'eBay Germany', value: 'EBAY_DE' },
  { label: 'eBay Australia', value: 'EBAY_AU' }
]

const FORMAT_OPTIONS = [
  { label: 'Fixed Price', value: 'FIXED_PRICE' },
  { label: 'Auction', value: 'AUCTION' }
]

const LISTING_DURATION_OPTIONS = [
  { label: 'Good ‘Til Cancelled', value: 'GTC' },
  { label: '1 Day', value: 'DAYS_1' },
  { label: '3 Days', value: 'DAYS_3' },
  { label: '5 Days', value: 'DAYS_5' },
  { label: '7 Days', value: 'DAYS_7' },
  { label: '10 Days', value: 'DAYS_10' },
  { label: '30 Days', value: 'DAYS_30' }
]

const LANGUAGE_OPTIONS = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'German', value: 'de-DE' },
  { label: 'French', value: 'fr-FR' }
]

const CURRENCY_OPTIONS = ['USD', 'CAD', 'EUR', 'GBP', 'AUD']

const DEFAULT_FORM_VALUES = {
  contentLanguage: 'en-US',
  marketplaceId: 'EBAY_US',
  format: 'FIXED_PRICE',
  listingDescription: '',
  listingDuration: 'GTC',
  listingStartDate: '',
  categoryId: '',
  merchantLocationKey: '',
  availableQuantity: '',
  quantityLimitPerBuyer: '',
  priceValue: '',
  priceCurrency: 'USD',
  minimumAdvertisedPriceValue: '',
  minimumAdvertisedPriceCurrency: 'USD',
  auctionStartPriceValue: '',
  auctionStartPriceCurrency: 'USD',
  auctionReservePriceValue: '',
  auctionReservePriceCurrency: 'USD',
  includeCatalogProductDetails: true,
  hideBuyerDetails: false,
  paymentPolicyId: '',
  fulfillmentPolicyId: '',
  returnPolicyId: '',
  eBayPlusIfEligible: false,
  bestOfferEnabled: false,
  autoAcceptPriceValue: '',
  autoAcceptPriceCurrency: 'USD',
  autoDeclinePriceValue: '',
  autoDeclinePriceCurrency: 'USD',
  storeCategoryInput: '',
  taxApply: false
}

const parseJsonField = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return null
}

const normalizeImageUrls = (source) => {
  if (!source) return []
  if (Array.isArray(source)) return source
  if (typeof source === 'string') {
    try {
      const parsed = JSON.parse(source)
      if (Array.isArray(parsed)) {
        return parsed
      }
      return [source]
    } catch {
      return [source]
    }
  }
  return []
}

const coerceNumber = (value) => {
  if (value === '' || value == null) {
    return undefined
  }
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

const coercePrice = (value, currency) => {
  if (value === '' || value == null) {
    return undefined
  }
  const trimmed = String(value).trim()
  if (!trimmed) {
    return undefined
  }
  return {
    currency: currency || 'USD',
    value: trimmed
  }
}

const buildOfferPayload = (values, offerRecord) => {
  if (!offerRecord?.sku) {
    throw new Error('Missing SKU for this offer.')
  }

  const payload = {
    sku: offerRecord.sku,
    marketplaceId: values.marketplaceId,
    format: values.format,
    includeCatalogProductDetails: Boolean(values.includeCatalogProductDetails),
    hideBuyerDetails: Boolean(values.hideBuyerDetails)
  }

  if (values.contentLanguage) {
    payload.contentLanguage = values.contentLanguage
  }

  if (values.categoryId) {
    payload.categoryId = values.categoryId.trim()
  }

  if (values.listingDescription) {
    payload.listingDescription = values.listingDescription.trim()
  }

  if (values.listingDuration) {
    payload.listingDuration = values.listingDuration
  }

  if (values.listingStartDate) {
    payload.listingStartDate = values.listingStartDate
  }

  if (values.merchantLocationKey) {
    payload.merchantLocationKey = values.merchantLocationKey.trim()
  }

  if (values.format === 'FIXED_PRICE') {
    const availableQuantity = coerceNumber(values.availableQuantity)
    if (typeof availableQuantity === 'number') {
      payload.availableQuantity = availableQuantity
    }

    const perBuyer = coerceNumber(values.quantityLimitPerBuyer)
    if (typeof perBuyer === 'number') {
      payload.quantityLimitPerBuyer = perBuyer
    }
  }

  const pricingSummary = {}

  const fixedPrice = coercePrice(values.priceValue, values.priceCurrency)
  if (fixedPrice) {
    pricingSummary.price = fixedPrice
  }

  const minimumAdvertisedPrice = coercePrice(
    values.minimumAdvertisedPriceValue,
    values.minimumAdvertisedPriceCurrency || values.priceCurrency
  )
  if (minimumAdvertisedPrice) {
    pricingSummary.minimumAdvertisedPrice = minimumAdvertisedPrice
  }

  const auctionStartPrice = coercePrice(
    values.auctionStartPriceValue,
    values.auctionStartPriceCurrency || values.priceCurrency
  )
  if (auctionStartPrice) {
    pricingSummary.auctionStartPrice = auctionStartPrice
  }

  const auctionReservePrice = coercePrice(
    values.auctionReservePriceValue,
    values.auctionReservePriceCurrency || values.priceCurrency
  )
  if (auctionReservePrice) {
    pricingSummary.auctionReservePrice = auctionReservePrice
  }

  if (Object.keys(pricingSummary).length > 0) {
    payload.pricingSummary = pricingSummary
  }

  const listingPolicies = {}
  if (values.paymentPolicyId) {
    listingPolicies.paymentPolicyId = values.paymentPolicyId.trim()
  }
  if (values.fulfillmentPolicyId) {
    listingPolicies.fulfillmentPolicyId = values.fulfillmentPolicyId.trim()
  }
  if (values.returnPolicyId) {
    listingPolicies.returnPolicyId = values.returnPolicyId.trim()
  }
  if (values.eBayPlusIfEligible) {
    listingPolicies.eBayPlusIfEligible = true
  }

  const bestOfferTerms = {}
  if (
    values.bestOfferEnabled ||
    values.autoAcceptPriceValue ||
    values.autoDeclinePriceValue
  ) {
    bestOfferTerms.bestOfferEnabled = Boolean(values.bestOfferEnabled)

    const autoAcceptPrice = coercePrice(
      values.autoAcceptPriceValue,
      values.autoAcceptPriceCurrency || values.priceCurrency
    )
    if (autoAcceptPrice) {
      bestOfferTerms.autoAcceptPrice = autoAcceptPrice
    }

    const autoDeclinePrice = coercePrice(
      values.autoDeclinePriceValue,
      values.autoDeclinePriceCurrency || values.priceCurrency
    )
    if (autoDeclinePrice) {
      bestOfferTerms.autoDeclinePrice = autoDeclinePrice
    }

    listingPolicies.bestOfferTerms = bestOfferTerms
  }

  if (Object.keys(listingPolicies).length > 0) {
    payload.listingPolicies = listingPolicies
  }

  const storeCategories = values.storeCategoryInput
    ? values.storeCategoryInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : []

  if (storeCategories.length) {
    payload.storeCategoryNames = storeCategories
  }

  if (values.taxApply) {
    payload.tax = { applyTax: true }
  }

  return payload
}

const mapOfferRecordToFormValues = (record) => {
  if (!record) {
    return DEFAULT_FORM_VALUES
  }

  const pricingSummary = parseJsonField(record.pricing_summary) || record.pricing_summary || {}
  const listingPolicies = parseJsonField(record.listing_policies) || record.listing_policies || {}
  const taxInfo = parseJsonField(record.tax) || record.tax || {}
  const storeCategories = Array.isArray(record.store_category_names)
    ? record.store_category_names
    : typeof record.store_category_names === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(record.store_category_names)
            return Array.isArray(parsed) ? parsed : [record.store_category_names]
          } catch {
            return record.store_category_names.split(',').map((item) => item.trim())
          }
        })()
      : []

  return {
    ...DEFAULT_FORM_VALUES,
    contentLanguage: record.content_language || record.contentLanguage || DEFAULT_FORM_VALUES.contentLanguage,
    marketplaceId: record.marketplace_id || record.marketplaceId || DEFAULT_FORM_VALUES.marketplaceId,
    format: record.format || DEFAULT_FORM_VALUES.format,
    listingDescription: record.listing_description || record.listingDescription || '',
    listingDuration: record.listing_duration || record.listingDuration || DEFAULT_FORM_VALUES.listingDuration,
    listingStartDate: record.listing_start_date || record.listingStartDate || '',
    categoryId: record.category_id || record.categoryId || '',
    merchantLocationKey: record.merchant_location_key || record.merchantLocationKey || '',
    availableQuantity:
      record.available_quantity ??
      record.availableQuantity ??
      DEFAULT_FORM_VALUES.availableQuantity,
    quantityLimitPerBuyer:
      record.quantity_limit_per_buyer ??
      record.quantityLimitPerBuyer ??
      DEFAULT_FORM_VALUES.quantityLimitPerBuyer,
    priceValue: pricingSummary?.price?.value || '',
    priceCurrency: pricingSummary?.price?.currency || DEFAULT_FORM_VALUES.priceCurrency,
    minimumAdvertisedPriceValue: pricingSummary?.minimumAdvertisedPrice?.value || '',
    minimumAdvertisedPriceCurrency:
      pricingSummary?.minimumAdvertisedPrice?.currency ||
      pricingSummary?.price?.currency ||
      DEFAULT_FORM_VALUES.minimumAdvertisedPriceCurrency,
    auctionStartPriceValue: pricingSummary?.auctionStartPrice?.value || '',
    auctionStartPriceCurrency:
      pricingSummary?.auctionStartPrice?.currency ||
      pricingSummary?.price?.currency ||
      DEFAULT_FORM_VALUES.auctionStartPriceCurrency,
    auctionReservePriceValue: pricingSummary?.auctionReservePrice?.value || '',
    auctionReservePriceCurrency:
      pricingSummary?.auctionReservePrice?.currency ||
      pricingSummary?.price?.currency ||
      DEFAULT_FORM_VALUES.auctionReservePriceCurrency,
    includeCatalogProductDetails:
      record.include_catalog_product_details ??
      record.includeCatalogProductDetails ??
      DEFAULT_FORM_VALUES.includeCatalogProductDetails,
    hideBuyerDetails:
      record.hide_buyer_details ??
      record.hideBuyerDetails ??
      DEFAULT_FORM_VALUES.hideBuyerDetails,
    paymentPolicyId: listingPolicies.paymentPolicyId || '',
    fulfillmentPolicyId: listingPolicies.fulfillmentPolicyId || '',
    returnPolicyId: listingPolicies.returnPolicyId || '',
    eBayPlusIfEligible: listingPolicies.eBayPlusIfEligible || false,
    bestOfferEnabled:
      listingPolicies.bestOfferTerms?.bestOfferEnabled ??
      DEFAULT_FORM_VALUES.bestOfferEnabled,
    autoAcceptPriceValue: listingPolicies.bestOfferTerms?.autoAcceptPrice?.value || '',
    autoAcceptPriceCurrency:
      listingPolicies.bestOfferTerms?.autoAcceptPrice?.currency ||
      pricingSummary?.price?.currency ||
      DEFAULT_FORM_VALUES.autoAcceptPriceCurrency,
    autoDeclinePriceValue: listingPolicies.bestOfferTerms?.autoDeclinePrice?.value || '',
    autoDeclinePriceCurrency:
      listingPolicies.bestOfferTerms?.autoDeclinePrice?.currency ||
      pricingSummary?.price?.currency ||
      DEFAULT_FORM_VALUES.autoDeclinePriceCurrency,
    storeCategoryInput: storeCategories.join(', '),
    taxApply: Boolean(taxInfo?.applyTax)
  }
}

export default function OfferForm({
  offerRecord,
  submitting = false,
  deleteInProgress = false,
  serverError = null,
  onSubmit,
  onCancel,
  onDelete
}) {
  const [formValues, setFormValues] = useState(DEFAULT_FORM_VALUES)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    setFormValues(mapOfferRecordToFormValues(offerRecord))
  }, [offerRecord])

  const productImages = useMemo(
    () => normalizeImageUrls(offerRecord?.product_image_urls),
    [offerRecord]
  )

  const primaryImage = productImages[0]
  const regulatoryInfo = useMemo(
    () => parseJsonField(offerRecord?.regulatory_info) || offerRecord?.regulatory_info || {},
    [offerRecord]
  )
  const offerStatusChip = offerRecord?.active ? (
    <Chip label="Active" color="success" size="small" />
  ) : (
    <Chip label="Inactive" color="default" size="small" />
  )

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setFormValues((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSwitchChange = (field) => (_, checked) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: checked
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)

    if (!offerRecord?.sku) {
      setFormError('This offer is missing a SKU and cannot be updated.')
      return
    }

    if (!formValues.marketplaceId || !formValues.format) {
      setFormError('Marketplace and format are required.')
      return
    }

    if (formValues.format === 'FIXED_PRICE' && !formValues.priceValue) {
      setFormError('Price is required for fixed price offers.')
      return
    }

    if (formValues.format === 'AUCTION' && !formValues.auctionStartPriceValue) {
      setFormError('Auction start price is required for auction offers.')
      return
    }

    try {
      const payload = buildOfferPayload(formValues, offerRecord)
      await onSubmit?.(payload)
    } catch (error) {
      setFormError(error.message || 'Failed to build offer payload.')
    }
  }

  const renderCurrencyField = ({
    label,
    valueKey,
    currencyKey,
    required = false,
    disabled = false,
    helperText
  }) => (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField
        label={label}
        type="number"
        size="small"
        fullWidth
        required={required}
        disabled={disabled}
        value={formValues[valueKey]}
        onChange={handleChange(valueKey)}
        inputProps={{ min: 0, step: '0.01' }}
        helperText={helperText}
      />
      <TextField
        label="Currency"
        select
        size="small"
        sx={{ minWidth: { xs: '100%', sm: 120 } }}
        value={formValues[currencyKey]}
        onChange={handleChange(currencyKey)}
      >
        {CURRENCY_OPTIONS.map((currency) => (
          <MenuItem key={currency} value={currency}>
            {currency}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  )

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  backgroundColor: 'background.paper'
                }}
              >
                {primaryImage ? (
                  <Box
                    component="img"
                    src={primaryImage}
                    alt={offerRecord?.product_title || 'Primary product image'}
                    sx={{
                      width: '100%',
                      display: 'block',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 200,
                      color: 'text.secondary',
                      backgroundColor: 'background.default'
                    }}
                  >
                    <Typography variant="body2">No image available</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack spacing={1.5}>
                <Typography variant="h5">
                  {offerRecord?.product_title || 'Untitled Offer'}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  {offerStatusChip}
                  <Chip
                    label={offerRecord?.format || 'N/A'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {regulatoryInfo?.ebay_offer_id && (
                    <Chip
                      label={`eBay Offer ID ${regulatoryInfo.ebay_offer_id}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Offer ID"
                      value={offerRecord?.id || ''}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="SKU"
                      value={offerRecord?.sku || ''}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Marketplace"
                      value={offerRecord?.marketplace_id || ''}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Updated"
                      value={
                        offerRecord?.updated_at
                          ? new Date(offerRecord.updated_at).toLocaleString()
                          : ''
                      }
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </Grid>
                <Alert severity="info">
                  SKU, product title, and images are managed via inventory items and cannot be edited here.
                </Alert>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Listing Basics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Content Language"
                select
                fullWidth
                size="small"
                value={formValues.contentLanguage}
                onChange={handleChange('contentLanguage')}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Marketplace"
                select
                required
                fullWidth
                size="small"
                value={formValues.marketplaceId}
                onChange={handleChange('marketplaceId')}
              >
                {MARKETPLACE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Format"
                select
                required
                fullWidth
                size="small"
                value={formValues.format}
                onChange={handleChange('format')}
              >
                {FORMAT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Listing Duration"
                select
                fullWidth
                size="small"
                required={formValues.format === 'AUCTION'}
                helperText={formValues.format === 'AUCTION' ? 'Required for auction listings' : ''}
                value={formValues.listingDuration}
                onChange={handleChange('listingDuration')}
              >
                {LISTING_DURATION_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Category ID"
                fullWidth
                size="small"
                value={formValues.categoryId}
                onChange={handleChange('categoryId')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Merchant Location Key"
                fullWidth
                size="small"
                value={formValues.merchantLocationKey}
                onChange={handleChange('merchantLocationKey')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Listing Description"
                fullWidth
                multiline
                minRows={3}
                value={formValues.listingDescription}
                onChange={handleChange('listingDescription')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Listing Start Date (ISO 8601)"
                fullWidth
                size="small"
                value={formValues.listingStartDate}
                onChange={handleChange('listingStartDate')}
                placeholder="2025-11-19T23:44:10Z"
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Availability & Pricing
          </Typography>
          <Grid container spacing={2}>
            {formValues.format === 'FIXED_PRICE' && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Available Quantity"
                    type="number"
                    size="small"
                    fullWidth
                    required
                    value={formValues.availableQuantity}
                    onChange={handleChange('availableQuantity')}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Quantity Limit Per Buyer"
                    type="number"
                    size="small"
                    fullWidth
                    value={formValues.quantityLimitPerBuyer}
                    onChange={handleChange('quantityLimitPerBuyer')}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              {renderCurrencyField({
                label: 'Price',
                valueKey: 'priceValue',
                currencyKey: 'priceCurrency',
                required: formValues.format === 'FIXED_PRICE'
              })}
            </Grid>
            <Grid item xs={12} sm={6}>
              {renderCurrencyField({
                label: 'Minimum Advertised Price',
                valueKey: 'minimumAdvertisedPriceValue',
                currencyKey: 'minimumAdvertisedPriceCurrency',
                helperText: 'Optional MAP setting'
              })}
            </Grid>
            {formValues.format === 'AUCTION' && (
              <>
                <Grid item xs={12} sm={6}>
                  {renderCurrencyField({
                    label: 'Auction Start Price',
                    valueKey: 'auctionStartPriceValue',
                    currencyKey: 'auctionStartPriceCurrency',
                    required: true,
                    helperText: 'Required for auction listings'
                  })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {renderCurrencyField({
                    label: 'Auction Reserve Price',
                    valueKey: 'auctionReservePriceValue',
                    currencyKey: 'auctionReservePriceCurrency',
                    helperText: 'Optional reserve price'
                  })}
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Listing Policies & Offers
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Payment Policy ID"
                fullWidth
                size="small"
                value={formValues.paymentPolicyId}
                onChange={handleChange('paymentPolicyId')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Fulfillment Policy ID"
                fullWidth
                size="small"
                value={formValues.fulfillmentPolicyId}
                onChange={handleChange('fulfillmentPolicyId')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Return Policy ID"
                fullWidth
                size="small"
                value={formValues.returnPolicyId}
                onChange={handleChange('returnPolicyId')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.eBayPlusIfEligible}
                    onChange={handleSwitchChange('eBayPlusIfEligible')}
                  />
                }
                label="Enable eBay Plus if eligible"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom>
                Best Offer Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.bestOfferEnabled}
                    onChange={handleSwitchChange('bestOfferEnabled')}
                  />
                }
                label="Allow Best Offers"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {renderCurrencyField({
                label: 'Auto Accept Price',
                valueKey: 'autoAcceptPriceValue',
                currencyKey: 'autoAcceptPriceCurrency'
              })}
            </Grid>
            <Grid item xs={12} sm={6}>
              {renderCurrencyField({
                label: 'Auto Decline Price',
                valueKey: 'autoDeclinePriceValue',
                currencyKey: 'autoDeclinePriceCurrency'
              })}
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Advanced Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Store Category Paths"
                placeholder="/shirts, /accessories"
                fullWidth
                size="small"
                value={formValues.storeCategoryInput}
                onChange={handleChange('storeCategoryInput')}
                helperText="Comma-separated list. Example: /sports-cards, /sealed-product"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.includeCatalogProductDetails}
                    onChange={handleSwitchChange('includeCatalogProductDetails')}
                  />
                }
                label="Include catalog product details"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.hideBuyerDetails}
                    onChange={handleSwitchChange('hideBuyerDetails')}
                  />
                }
                label="Hide buyer details"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.taxApply}
                    onChange={handleSwitchChange('taxApply')}
                  />
                }
                label="Apply seller tax table"
              />
            </Grid>
          </Grid>
        </Paper>

        {(serverError || formError) && (
          <Alert severity="error">
            {serverError || formError}
          </Alert>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="outlined" color="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Offer'}
            </Button>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {onDelete && (
              <Button
                variant="outlined"
                color="error"
                onClick={onDelete}
                disabled={deleteInProgress}
              >
                {deleteInProgress ? 'Deleting...' : 'Delete Offer'}
              </Button>
            )}
            <Tooltip title="Publishing offers from the web app is not yet enabled.">
              <span>
                <Button variant="contained" color="secondary" disabled>
                  Publish Offer
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

