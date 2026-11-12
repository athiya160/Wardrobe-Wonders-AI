import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Stack,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  InputAdornment,
  Collapse,
} from "@mui/material";
import {
  StorefrontOutlined as StoreIcon,
  CheckroomOutlined as ProductsIcon,
  AddCircleOutline as AddIcon,
  ReceiptLongOutlined as OrdersIcon,
  MonetizationOnOutlined as PayoutsIcon,
  EditOutlined as EditIcon,
  WarningAmberOutlined as DefectIcon,
  CheckCircleOutline as ApprovedIcon,
  HourglassEmptyOutlined as PendingIcon,
  CancelOutlined as RejectedIcon,
  LocalShippingOutlined as ShippingIcon,
  DashboardOutlined as OverviewIcon,
  Inventory2Outlined as InventoryIcon,
  DeleteOutline as DeleteIcon,
  CloudUploadOutlined as UploadIcon,
  RemoveCircleOutline as MinusIcon,
  SaveOutlined as SaveIcon,
  OpenInNewOutlined as OpenInNewIcon,
  DiscountOutlined as DiscountIcon,
  InfoOutlined as InfoIcon,
  ArchiveOutlined as ArchiveIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  ShieldOutlined as ShieldIcon,
  SearchOutlined as SearchIcon,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";

const CATEGORIES_DATA = {
  Clothing: ["Sarees & Lehengas", "Kurtas & Sherwanis", "Tuxedos & Suits", "Shirts & Tops"],
  Dresses: ["Bridal & Wedding", "Evening Gowns", "Cocktail Dresses"],
  Jewellery: ["Bridal Sets", "Chokers & Necklaces", "Earrings & Jhumkas", "Bangles & Kadas"],
  Accessories: ["Potlis & Clutches", "Embroidered Dupattas", "Stoles & Shawls"],
  Footwear: ["Bridal Juttis", "Mojris & Nagras", "Luxury Heels"],
  "Pre-loved Vintage": ["Archival Couture", "Vintage Silks", "Designer Resale"],
};

export default function SellerDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Primary navigation tab
  const [activeTab, setActiveTab] = useState("overview");
  // Sub-filter for products tab
  const [productFilter, setProductFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Store profile & metrics state
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
    draftProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  });

  // Financial ledger state
  const [sellerFinances, setSellerFinances] = useState(null);
  const [sellerLedger, setSellerLedger] = useState([]);
  const [financesLoading, setFinancesLoading] = useState(false);

  // Orders & Fulfilment State
  const [sellerOrders, setSellerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState("ALL");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersCounts, setOrdersCounts] = useState({
    ALL: 0,
    ORDER_PLACED: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  });

  // Action Modals State
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [orderToShip, setOrderToShip] = useState(null);
  const [shipForm, setShipForm] = useState({
    courierName: "Blue Dart",
    trackingNumber: "",
    trackingUrl: "",
    dispatchedAt: new Date().toISOString().slice(0, 10),
    estimatedDelivery: "",
    note: "",
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [orderTimelineOpen, setOrderTimelineOpen] = useState(false);
  const [selectedSellerOrder, setSelectedSellerOrder] = useState(null);

  const [orderActionLoading, setOrderActionLoading] = useState(false);

  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  // Add / Edit Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  // Product Form State
  const [productForm, setProductForm] = useState({
    title: "",
    brand: "",
    description: "",
    category: "Clothing",
    subcategory: "Sarees & Lehengas",
    condition: "NEW",
    conditionDescription: "",
    price: "",
    originalRetailPrice: "",
    stockQuantity: "1",
    images: [],
    imageUrlInput: "",
    defectImages: [],
    defectUrlInput: "",
    variants: [],
    shippingFee: "0",
    dispatchDays: "2",
    shippingMethod: "Standard Express Courier",
    returnPolicyDays: "7",
  });

  // Store Profile Form State
  const [storeForm, setStoreForm] = useState({
    storeName: "",
    description: "",
    logo: "",
    banner: "",
    city: "",
    state: "",
    address: "",
    pincode: "",
    email: "",
    phone: "",
    website: "",
    instagram: "",
    standardShippingFee: "0",
    estimatedDaysMin: "2",
    estimatedDaysMax: "5",
    freeShippingAbove: "0",
    policyDetails: "",
  });
  const [savingStore, setSavingStore] = useState(false);

  // Quick Inline Inventory Stock State
  const [inventoryStockMap, setInventoryStockMap] = useState({});
  const [inventoryUpdatingId, setInventoryUpdatingId] = useState(null);
  const [expandedInventoryRow, setExpandedInventoryRow] = useState(null);

  // Delete / Archive confirmation
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [productToArchive, setProductToArchive] = useState(null);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchSellerData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Overview metrics
      const overviewRes = await axios.get(`${BASE_URL}/store/seller/overview`, authHeaders);
      if (overviewRes.data?.success) {
        setMetrics(overviewRes.data.metrics || {});
      }

      // 2. Fetch Store Profile
      const storeRes = await axios.get(`${BASE_URL}/store/seller/store`, authHeaders);
      if (storeRes.data?.success) {
        const s = storeRes.data.store;
        setStore(s);
        setStoreForm({
          storeName: s.storeName || "",
          description: s.description || "",
          logo: s.logo || "",
          banner: s.banner || "",
          city: s.location?.city || "",
          state: s.location?.state || "",
          address: s.location?.address || "",
          pincode: s.location?.pincode || "",
          email: s.contact?.email || "",
          phone: s.contact?.phone || "",
          website: s.contact?.website || "",
          instagram: s.contact?.instagram || "",
          standardShippingFee: String(s.shippingPolicy?.standardShippingFee || "0"),
          estimatedDaysMin: String(s.shippingPolicy?.estimatedDaysMin || "2"),
          estimatedDaysMax: String(s.shippingPolicy?.estimatedDaysMax || "5"),
          freeShippingAbove: String(s.shippingPolicy?.freeShippingAbove || "0"),
          policyDetails: s.shippingPolicy?.policyDetails || "",
        });
      }

      // 3. Fetch Products
      const prodRes = await axios.get(`${BASE_URL}/store/seller/products`, authHeaders);
      if (prodRes.data?.success) {
        const prodList = prodRes.data.products || [];
        setProducts(prodList);

        // Pre-populate inventory stock map
        const stockMap = {};
        prodList.forEach((p) => {
          stockMap[p._id] = {
            stockQuantity: p.stockQuantity,
            variants: p.variants ? JSON.parse(JSON.stringify(p.variants)) : [],
          };
        });
        setInventoryStockMap(stockMap);
      }

      // 4. Fetch Seller Finances & Ledger
      try {
        const [finRes, ledgerRes] = await Promise.all([
          axios.get(`${BASE_URL}/store/seller/finances/overview`, authHeaders),
          axios.get(`${BASE_URL}/store/seller/finances/ledger`, authHeaders),
        ]);
        if (finRes.data?.success) setSellerFinances(finRes.data.finances);
        if (ledgerRes.data?.success) setSellerLedger(ledgerRes.data.entries || []);
      } catch (finErr) {
        console.error("Seller finances fetch error:", finErr);
      }

      // 5. Fetch Seller Fulfilment Orders
      await fetchSellerOrders();
    } catch (err) {
      console.error("Seller dashboard error:", err);
      if (err.response?.status === 403) {
        navigate("/store/become-seller");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/store/seller/orders`, {
        ...authHeaders,
        params: {
          status: ordersFilter !== "ALL" ? ordersFilter : undefined,
          search: ordersSearch || undefined,
        },
      });
      if (res.data?.success) {
        setSellerOrders(res.data.orders || []);
        if (res.data.countsByStatus) {
          setOrdersCounts(res.data.countsByStatus);
        }
      }
    } catch (err) {
      console.error("Fetch seller orders error:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchSellerData();
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSellerOrders();
    }
  }, [ordersFilter, ordersSearch]);

  // Fulfilment Action Handlers
  const handleConfirmOrder = async (order) => {
    setOrderActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/store/seller/orders/${order._id}/confirm`,
        { note: "Confirmed by boutique." },
        authHeaders
      );
      if (res.data?.success) {
        setNotification({ open: true, message: "Order confirmed successfully.", severity: "success" });
        setConfirmModalOpen(false);
        fetchSellerOrders();
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to confirm order.",
        severity: "error",
      });
    } finally {
      setOrderActionLoading(false);
    }
  };

  const handleMarkProcessing = async (order) => {
    setOrderActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/store/seller/orders/${order._id}/processing`,
        { note: "Preparing and packaging order." },
        authHeaders
      );
      if (res.data?.success) {
        setNotification({ open: true, message: "Order marked as processing.", severity: "success" });
        fetchSellerOrders();
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to update order to processing.",
        severity: "error",
      });
    } finally {
      setOrderActionLoading(false);
    }
  };

  const handleOpenShipModal = (order) => {
    setOrderToShip(order);
    setShipForm({
      courierName: "Blue Dart",
      trackingNumber: "",
      trackingUrl: "",
      dispatchedAt: new Date().toISOString().slice(0, 10),
      estimatedDelivery: "",
      note: "",
    });
    setShipModalOpen(true);
  };

  const handleSubmitShip = async () => {
    if (!shipForm.courierName.trim()) {
      setNotification({ open: true, message: "Courier partner name is required.", severity: "error" });
      return;
    }
    if (!shipForm.trackingNumber.trim()) {
      setNotification({ open: true, message: "Tracking / AWB number is required.", severity: "error" });
      return;
    }

    setOrderActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/store/seller/orders/${orderToShip._id}/ship`,
        shipForm,
        authHeaders
      );
      if (res.data?.success) {
        setNotification({ open: true, message: "Order marked as dispatched and tracking recorded.", severity: "success" });
        setShipModalOpen(false);
        fetchSellerOrders();
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to mark order as shipped.",
        severity: "error",
      });
    } finally {
      setOrderActionLoading(false);
    }
  };

  const handleMarkDelivered = async (order) => {
    setOrderActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/store/seller/orders/${order._id}/deliver`,
        { deliveryConfirmationNote: "Manual delivery marked by seller boutique." },
        authHeaders
      );
      if (res.data?.success) {
        setNotification({ open: true, message: "Order marked as delivered.", severity: "success" });
        fetchSellerOrders();
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to mark order as delivered.",
        severity: "error",
      });
    } finally {
      setOrderActionLoading(false);
    }
  };

  const handleOpenCancelModal = (order) => {
    setOrderToCancel(order);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleSubmitCancel = async () => {
    if (!cancelReason.trim()) {
      setNotification({ open: true, message: "Cancellation reason is required.", severity: "error" });
      return;
    }

    setOrderActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/store/seller/orders/${orderToCancel._id}/cancel`,
        { reason: cancelReason },
        authHeaders
      );
      if (res.data?.success) {
        setNotification({ open: true, message: "Order cancelled successfully.", severity: "success" });
        setCancelModalOpen(false);
        fetchSellerOrders();
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to cancel order.",
        severity: "error",
      });
    } finally {
      setOrderActionLoading(false);
    }
  };

  const handleOpenTimeline = (order) => {
    setSelectedSellerOrder(order);
    setOrderTimelineOpen(true);
  };

  // Product Form Field Handlers
  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "category") {
        const subcats = CATEGORIES_DATA[value] || [];
        updated.subcategory = subcats[0] || "";
      }
      return updated;
    });
  };

  // Image Upload helper
  const handleFileUpload = async (e, targetField) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setNotification({ open: true, message: "File exceeds 10MB limit.", severity: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setImageUploadLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl = res.data?.primaryUrl || res.data?.urls?.[0];
      if (uploadedUrl) {
        if (targetField === "productImages") {
          setProductForm((prev) => ({
            ...prev,
            images: [...prev.images, uploadedUrl],
          }));
        } else if (targetField === "defectImages") {
          setProductForm((prev) => ({
            ...prev,
            defectImages: [...prev.defectImages, uploadedUrl],
          }));
        } else if (targetField === "storeLogo") {
          setStoreForm((prev) => ({ ...prev, logo: uploadedUrl }));
        } else if (targetField === "storeBanner") {
          setStoreForm((prev) => ({ ...prev, banner: uploadedUrl }));
        }
        setNotification({ open: true, message: "Image uploaded successfully!", severity: "success" });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setNotification({
        open: true,
        message: err.response?.data?.message || "Image upload failed. You can also paste an image URL directly.",
        severity: "error",
      });
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleAddImageUrl = (type) => {
    if (type === "product") {
      const url = productForm.imageUrlInput.trim();
      if (!url) return;
      setProductForm((prev) => ({
        ...prev,
        images: [...prev.images, url],
        imageUrlInput: "",
      }));
    } else if (type === "defect") {
      const url = productForm.defectUrlInput.trim();
      if (!url) return;
      setProductForm((prev) => ({
        ...prev,
        defectImages: [...prev.defectImages, url],
        defectUrlInput: "",
      }));
    }
  };

  const handleRemoveImage = (type, index) => {
    if (type === "product") {
      setProductForm((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else if (type === "defect") {
      setProductForm((prev) => ({
        ...prev,
        defectImages: prev.defectImages.filter((_, i) => i !== index),
      }));
    }
  };

  // Variant manager handlers
  const handleAddVariant = () => {
    setProductForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { size: "M", color: "Gold", stockQuantity: 1, sku: "", priceOverride: "" },
      ],
    }));
  };

  const handleUpdateVariant = (index, field, value) => {
    setProductForm((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveVariant = (index) => {
    setProductForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  // Open modal for new product
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: "",
      brand: "",
      description: "",
      category: "Clothing",
      subcategory: "Sarees & Lehengas",
      condition: "NEW",
      conditionDescription: "",
      price: "",
      originalRetailPrice: "",
      stockQuantity: "1",
      images: [],
      imageUrlInput: "",
      defectImages: [],
      defectUrlInput: "",
      variants: [],
      shippingFee: "0",
      dispatchDays: "2",
      shippingMethod: "Standard Express Courier",
      returnPolicyDays: "7",
    });
    setProductModalOpen(true);
  };

  // Open modal to edit existing product
  const handleOpenEditModal = (item) => {
    setEditingProduct(item);
    setProductForm({
      title: item.title || "",
      brand: item.brand || "",
      description: item.description || "",
      category: item.category || "Clothing",
      subcategory: item.subcategory || "",
      condition: item.condition || "NEW",
      conditionDescription: item.conditionDescription || "",
      price: String(item.price || ""),
      originalRetailPrice: item.originalRetailPrice ? String(item.originalRetailPrice) : "",
      stockQuantity: String(item.stockQuantity ?? 1),
      images: Array.isArray(item.images) ? [...item.images] : [],
      imageUrlInput: "",
      defectImages: Array.isArray(item.defectImages) ? [...item.defectImages] : [],
      defectUrlInput: "",
      variants: Array.isArray(item.variants)
        ? item.variants.map((v) => ({
            size: v.size || "",
            color: v.color || "",
            stockQuantity: v.stockQuantity ?? 0,
            sku: v.sku || "",
            priceOverride: v.priceOverride ? String(v.priceOverride) : "",
          }))
        : [],
      shippingFee: String(item.shippingInformation?.shippingFee ?? 0),
      dispatchDays: String(item.shippingInformation?.dispatchDays ?? 2),
      shippingMethod: item.shippingInformation?.shippingMethod || "Standard Express Courier",
      returnPolicyDays: String(item.shippingInformation?.returnPolicyDays ?? 7),
    });
    setProductModalOpen(true);
  };

  // Save product (Draft or Submit)
  const handleSaveProduct = async (asDraft = false) => {
    if (!productForm.title || !productForm.description || !productForm.price) {
      setNotification({ open: true, message: "Please fill in all mandatory product fields.", severity: "warning" });
      return;
    }

    if (productForm.images.length === 0) {
      setNotification({ open: true, message: "At least one product image is required.", severity: "warning" });
      return;
    }

    if (productForm.condition === "PRE_OWNED" && !productForm.conditionDescription.trim()) {
      setNotification({
        open: true,
        message: "Pre-owned listings strictly require condition disclosures detailing wear or flaws.",
        severity: "warning",
      });
      return;
    }

    setSubmittingProduct(true);
    const payload = {
      title: productForm.title.trim(),
      brand: productForm.brand.trim(),
      description: productForm.description.trim(),
      category: productForm.category,
      subcategory: productForm.subcategory,
      condition: productForm.condition,
      conditionDescription: productForm.conditionDescription.trim(),
      defectImages: productForm.defectImages,
      price: Number(productForm.price),
      originalRetailPrice: productForm.originalRetailPrice ? Number(productForm.originalRetailPrice) : null,
      stockQuantity: Math.max(0, parseInt(productForm.stockQuantity, 10) || 0),
      images: productForm.images,
      variants: productForm.variants.map((v) => ({
        size: v.size,
        color: v.color,
        stockQuantity: Math.max(0, parseInt(v.stockQuantity, 10) || 0),
        sku: v.sku,
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
      })),
      shippingInformation: {
        shippingFee: Number(productForm.shippingFee) || 0,
        dispatchDays: Math.max(1, parseInt(productForm.dispatchDays, 10) || 2),
        shippingMethod: productForm.shippingMethod || "Standard Express Courier",
        returnPolicyDays: Math.max(0, parseInt(productForm.returnPolicyDays, 10) || 7),
      },
      asDraft,
      resubmit: editingProduct && editingProduct.status === "REJECTED",
      submitForReview: !asDraft && editingProduct && editingProduct.status === "DRAFT",
    };

    try {
      let res;
      if (editingProduct) {
        res = await axios.put(`${BASE_URL}/store/seller/products/${editingProduct._id}`, payload, authHeaders);
      } else {
        res = await axios.post(`${BASE_URL}/store/seller/products`, payload, authHeaders);
      }

      if (res.data?.success) {
        setProductModalOpen(false);
        setNotification({
          open: true,
          message: res.data.message || "Product saved successfully.",
          severity: "success",
        });
        fetchSellerData();
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to save product listing.",
        severity: "error",
      });
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Archive product handler
  const handleConfirmArchive = async () => {
    if (!productToArchive) return;
    try {
      const res = await axios.delete(`${BASE_URL}/store/seller/products/${productToArchive._id}`, authHeaders);
      if (res.data?.success) {
        setNotification({ open: true, message: "Product archived successfully.", severity: "success" });
        setArchiveDialogOpen(false);
        setProductToArchive(null);
        fetchSellerData();
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to archive product.",
        severity: "error",
      });
    }
  };

  // Inline Quick Stock Adjustment
  const handleInventoryStockChange = (productId, delta) => {
    setInventoryStockMap((prev) => {
      const current = prev[productId]?.stockQuantity ?? 0;
      const nextStock = Math.max(0, current + delta);
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          stockQuantity: nextStock,
        },
      };
    });
  };

  const handleInventoryDirectInput = (productId, val) => {
    const parsed = parseInt(val, 10);
    const nextStock = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setInventoryStockMap((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        stockQuantity: nextStock,
      },
    }));
  };

  const handleSaveInventory = async (productId) => {
    setInventoryUpdatingId(productId);
    const itemData = inventoryStockMap[productId];
    if (!itemData) return;

    try {
      const res = await axios.patch(
        `${BASE_URL}/store/seller/products/${productId}/inventory`,
        {
          stockQuantity: itemData.stockQuantity,
          variants: itemData.variants,
        },
        authHeaders
      );

      if (res.data?.success) {
        setNotification({ open: true, message: "Inventory stock updated successfully!", severity: "success" });
        fetchSellerData();
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to update inventory stock.",
        severity: "error",
      });
    } finally {
      setInventoryUpdatingId(null);
    }
  };

  // Save Store Settings Handler
  const handleSaveStoreProfile = async (e) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      const payload = {
        storeName: storeForm.storeName.trim(),
        description: storeForm.description.trim(),
        logo: storeForm.logo,
        banner: storeForm.banner,
        location: {
          address: storeForm.address.trim(),
          city: storeForm.city.trim(),
          state: storeForm.state.trim(),
          pincode: storeForm.pincode.trim(),
        },
        contact: {
          email: storeForm.email.trim(),
          phone: storeForm.phone.trim(),
          website: storeForm.website.trim(),
          instagram: storeForm.instagram.trim(),
        },
        shippingPolicy: {
          standardShippingFee: Number(storeForm.standardShippingFee) || 0,
          estimatedDaysMin: Math.max(1, parseInt(storeForm.estimatedDaysMin, 10) || 2),
          estimatedDaysMax: Math.max(1, parseInt(storeForm.estimatedDaysMax, 10) || 5),
          freeShippingAbove: Number(storeForm.freeShippingAbove) || 0,
          policyDetails: storeForm.policyDetails.trim(),
        },
      };

      const res = await axios.put(`${BASE_URL}/store/seller/store`, payload, authHeaders);
      if (res.data?.success) {
        setNotification({ open: true, message: "Store profile and policies updated successfully!", severity: "success" });
        fetchSellerData();
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to update store settings.",
        severity: "error",
      });
    } finally {
      setSavingStore(false);
    }
  };

  // Status Chip Component
  const getStatusChip = (status) => {
    switch (status) {
      case "APPROVED":
        return <Chip label="Approved & Live" size="small" sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }} />;
      case "PENDING_REVIEW":
        return <Chip label="Pending Admin Review" size="small" sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontWeight: 700 }} />;
      case "REJECTED":
        return <Chip label="Needs Revision" size="small" sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 700 }} />;
      case "DRAFT":
        return <Chip label="Draft" size="small" sx={{ bgcolor: "#F5F5F5", color: "#757575", fontWeight: 700 }} />;
      case "SUSPENDED":
        return <Chip label="Suspended" size="small" sx={{ bgcolor: "#EEEEEE", color: "#616161", fontWeight: 700 }} />;
      case "ARCHIVED":
        return <Chip label="Archived" size="small" sx={{ bgcolor: "#E0E0E0", color: "#9E9E9E", fontWeight: 700 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Stock Badge Component
  const getStockBadge = (stock) => {
    if (stock === 0) {
      return (
        <Chip
          label="Out of Stock"
          size="small"
          sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 800, fontSize: "0.72rem" }}
        />
      );
    }
    if (stock <= 3) {
      return (
        <Chip
          label={`Low Stock (${stock})`}
          size="small"
          sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontWeight: 800, fontSize: "0.72rem" }}
        />
      );
    }
    return (
      <Chip
        label={`${stock} in stock`}
        size="small"
        sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.72rem" }}
      />
    );
  };

  // Filtered products list based on active filter
  const filteredProducts = products.filter((p) => {
    if (productFilter === "approved") return p.status === "APPROVED";
    if (productFilter === "pending") return p.status === "PENDING_REVIEW";
    if (productFilter === "rejected") return p.status === "REJECTED";
    if (productFilter === "draft") return p.status === "DRAFT";
    return p.status !== "ARCHIVED";
  });

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container sx={{ py: 12, textAlign: "center" }}>
          <CircularProgress sx={{ color: "#D1A362" }} />
          <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
            Loading Wardrobe Wonders Seller Portal...
          </Typography>
        </Container>
        <Fotter />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5", color: "#1A1817" }}>
      <ResponsiveAppBar />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Storefront Header Card */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid #ECE7DE",
            bgcolor: "#FFFFFF",
            mb: 4,
            backgroundImage: store?.banner ? `linear-gradient(rgba(26, 24, 23, 0.75), rgba(26, 24, 23, 0.85)), url(${store.banner})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: store?.banner ? "#FFFFFF" : "#1A1817",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Avatar
                  src={store?.logo}
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: "#D1A362",
                    color: "#1A1817",
                    fontWeight: 800,
                    fontSize: "1.75rem",
                    border: "2px solid #FFFFFF",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  {store?.storeName ? store.storeName[0].toUpperCase() : "S"}
                </Avatar>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontSize: { xs: "1.5rem", md: "1.85rem" },
                      }}
                    >
                      {store?.storeName}
                    </Typography>
                    <Chip
                      label={store?.status || "ACTIVE"}
                      size="small"
                      sx={{
                        bgcolor: store?.status === "ACTIVE" ? "#E8F5E9" : "#FFEBEE",
                        color: store?.status === "ACTIVE" ? "#2E7D32" : "#C62828",
                        fontWeight: 800,
                        fontSize: "0.72rem",
                      }}
                    />
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: store?.banner ? "rgba(255,255,255,0.85)" : "text.secondary",
                      mt: 0.5,
                      maxWidth: 600,
                    }}
                  >
                    {store?.description || "Curated Multi-Vendor Fashion Store on Wardrobe Wonders"}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: store?.banner ? "rgba(255,255,255,0.7)" : "text.secondary",
                      display: "block",
                      mt: 0.5,
                    }}
                  >
                    Origin: {store?.location?.city || "Jaipur"}, {store?.location?.state || "Rajasthan"} • Store Slug:{" "}
                    <strong>{store?.storeSlug}</strong>
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Stack direction="row" spacing={1.5} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                {store?.storeSlug && (
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to={`/store/storefront/${store.storeSlug}`}
                    target="_blank"
                    startIcon={<OpenInNewIcon />}
                    sx={{
                      borderColor: store?.banner ? "#FFFFFF" : "#D1A362",
                      color: store?.banner ? "#FFFFFF" : "#1A1817",
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 2,
                    }}
                  >
                    Public Storefront
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddModal}
                  sx={{
                    bgcolor: "#1A1817",
                    color: "#D1A362",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    "&:hover": { bgcolor: "#2C2825" },
                  }}
                >
                  Add New Product
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Primary Dashboard Navigation Tabs */}
        <Box sx={{ borderBottom: "1px solid #ECE7DE", mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.95rem" },
              "& .MuiTabs-indicator": { bgcolor: "#D1A362", height: 3 },
            }}
          >
            <Tab
              value="overview"
              label="Dashboard Overview"
              icon={<OverviewIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              value="products"
              label={`My Products (${metrics.totalProducts})`}
              icon={<ProductsIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              value="inventory"
              label={`Inventory Tools ${metrics.lowStockProducts > 0 ? `(${metrics.lowStockProducts} Low)` : ""}`}
              icon={<InventoryIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              value="profile"
              label="Store Profile & Settings"
              icon={<StoreIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              value="finances"
              label="Finances & Ledger"
              icon={<PayoutsIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              value="orders"
              label={`Fulfilment Orders ${ordersCounts.ORDER_PLACED > 0 ? `(${ordersCounts.ORDER_PLACED} New)` : ""}`}
              icon={<ShippingIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* =========================================================================
            TAB 1: DASHBOARD OVERVIEW & EXECUTIVE METRICS
            ========================================================================= */}
        {activeTab === "overview" && (
          <Box>
            {/* Metric KPI Grid */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    border: "1px solid #ECE7DE",
                    bgcolor: "#FFFFFF",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    TOTAL LISTINGS
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: "#1A1817", mt: 0.5 }}>
                    {metrics.totalProducts}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Active catalog items in your store
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    border: "1px solid #ECE7DE",
                    bgcolor: "#FFFFFF",
                    borderLeft: "4px solid #2E7D32",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#2E7D32", fontWeight: 700 }}>
                    APPROVED & LIVE
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: "#2E7D32", mt: 0.5 }}>
                    {metrics.approvedProducts}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Publicly discoverable by customers
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    border: "1px solid #ECE7DE",
                    bgcolor: "#FFFFFF",
                    borderLeft: "4px solid #E65100",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#E65100", fontWeight: 700 }}>
                    PENDING ADMIN REVIEW
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: "#E65100", mt: 0.5 }}>
                    {metrics.pendingProducts}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Awaiting admin quality moderation
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    border: "1px solid #ECE7DE",
                    bgcolor: "#FFFFFF",
                    borderLeft: "4px solid #C62828",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#C62828", fontWeight: 700 }}>
                    REJECTED / ACTION NEEDED
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: "#C62828", mt: 0.5 }}>
                    {metrics.rejectedProducts}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Requires edits and resubmission
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Secondary Inventory Insights Banner */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid #ECE7DE",
                    bgcolor: "#FFFFFF",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Low Stock Listings (≤ 3 Units)
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {metrics.lowStockProducts} products are running low on inventory
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setActiveTab("inventory")}
                    sx={{ textTransform: "none", fontWeight: 700, borderColor: "#D1A362", color: "#1A1817" }}
                  >
                    Manage Stock
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid #ECE7DE",
                    bgcolor: "#FFFFFF",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Drafts in Progress
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {metrics.draftProducts} unpublished drafts saved
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setActiveTab("products");
                      setProductFilter("draft");
                    }}
                    sx={{ textTransform: "none", fontWeight: 700, borderColor: "#D1A362", color: "#1A1817" }}
                  >
                    View Drafts
                  </Button>
                </Paper>
              </Grid>
            </Grid>

            {/* Quality & Moderation Guide */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, fontFamily: '"Playfair Display", Georgia, serif' }}>
                Wardrobe Wonders Quality & Moderation Guidelines
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                As an approved seller, you maintain high luxury fashion standards. Every product passes through
                verification before public discovery:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: "#FAF8F5", borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                      1. Brand New Listings
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Must be pristine, unworn, and accurately photographed. Provide clear size and colour variants.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: "#FAF8F5", borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                      2. Pre-loved Disclosures
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Mandatory condition disclosures and wear photos. Never misrepresent pre-owned items as new.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: "#FAF8F5", borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                      3. Dispatch & Delivery
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Sellers manage their own shipping and tracking. Ensure packaging matches luxury expectations.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* Modal: Cancel Order Modal */}
        <Dialog
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#D32F2F" }}>
            Cancel Order #{orderToCancel?.fulfilmentOrderNumber}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Are you sure you want to cancel this shipment? A valid cancellation reason is required for platform audit.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Cancellation Reason"
              placeholder="e.g. Item damaged during quality check, out of stock, size defect..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCancelModalOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
              Back
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleSubmitCancel}
              disabled={orderActionLoading || !cancelReason.trim()}
              sx={{ fontWeight: 700, textTransform: "none" }}
            >
              {orderActionLoading ? <CircularProgress size={20} color="inherit" /> : "Confirm Cancellation"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Seller Order Audit Timeline Modal */}
        <Dialog
          open={orderTimelineOpen}
          onClose={() => setOrderTimelineOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            Fulfilment #{selectedSellerOrder?.fulfilmentOrderNumber} — Status Timeline
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            {selectedSellerOrder && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                    State Transition Audit History
                  </Typography>
                  {selectedSellerOrder.statusHistory && selectedSellerOrder.statusHistory.length > 0 ? (
                    <Stack spacing={1.5}>
                      {selectedSellerOrder.statusHistory.map((h, hIdx) => (
                        <Paper key={hIdx} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FAF9F7" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={h.status} size="small" sx={{ fontWeight: 700 }} />
                              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                                By: {h.changedByName || h.role} ({h.role})
                              </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {new Date(h.changedAt).toLocaleString("en-IN")}
                            </Typography>
                          </Stack>
                          {h.note && (
                            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontSize: "0.85rem" }}>
                              {h.note}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      Initial state: {selectedSellerOrder.status}
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOrderTimelineOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* =========================================================================
            TAB 2: MY PRODUCTS & MODERATION TABLE
            ========================================================================= */}
        {activeTab === "products" && (
          <Box>
            {/* Filter Chips Bar */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 700, mr: 1, color: "text.secondary" }}>
                  Filter by Status:
                </Typography>
                <Chip
                  label={`All Listings (${products.length})`}
                  clickable
                  onClick={() => setProductFilter("all")}
                  color={productFilter === "all" ? "primary" : "default"}
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`Approved & Live (${metrics.approvedProducts})`}
                  clickable
                  onClick={() => setProductFilter("approved")}
                  color={productFilter === "approved" ? "success" : "default"}
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`In Review (${metrics.pendingProducts})`}
                  clickable
                  onClick={() => setProductFilter("pending")}
                  color={productFilter === "pending" ? "warning" : "default"}
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`Rejected (${metrics.rejectedProducts})`}
                  clickable
                  onClick={() => setProductFilter("rejected")}
                  color={productFilter === "rejected" ? "error" : "default"}
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`Drafts (${metrics.draftProducts})`}
                  clickable
                  onClick={() => setProductFilter("draft")}
                  color={productFilter === "draft" ? "info" : "default"}
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Paper>

            {/* Products Table */}
            <Paper elevation={0} sx={{ border: "1px solid #ECE7DE", borderRadius: 2, overflow: "hidden" }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: "#FAF8F5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Condition</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price & MRP</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Inventory</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Moderation Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Review Notes</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        <ProductsIcon sx={{ fontSize: 48, color: "#ECE7DE", mb: 1, display: "block", mx: "auto" }} />
                        No product listings found in this filter view.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((item) => (
                      <TableRow key={item._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              src={item.images?.[0]}
                              variant="rounded"
                              sx={{ width: 48, height: 56, bgcolor: "#FAF8F5", border: "1px solid #ECE7DE" }}
                            />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {item.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {item.brand ? <strong>{item.brand} • </strong> : null}
                                {item.category} {item.subcategory ? `> ${item.subcategory}` : ""}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.condition === "PRE_OWNED" ? "Pre-loved" : "Brand New"}
                            size="small"
                            sx={{
                              bgcolor: item.condition === "PRE_OWNED" ? "#FFF8E1" : "#E8F5E9",
                              color: item.condition === "PRE_OWNED" ? "#F57F17" : "#2E7D32",
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            ₹{item.price?.toLocaleString("en-IN")}
                          </Typography>
                          {item.originalRetailPrice && item.originalRetailPrice > item.price && (
                            <Typography variant="caption" sx={{ color: "text.secondary", textDecoration: "line-through" }}>
                              MRP: ₹{item.originalRetailPrice.toLocaleString("en-IN")}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{getStockBadge(item.stockQuantity)}</TableCell>
                        <TableCell>{getStatusChip(item.status)}</TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          {item.adminReviewNotes ? (
                            <Typography
                              variant="caption"
                              sx={{
                                color: item.status === "REJECTED" ? "error.main" : "text.secondary",
                                fontWeight: item.status === "REJECTED" ? 700 : 400,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {item.adminReviewNotes}
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: "text.disabled" }}>
                              None
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit Product">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditModal(item)}
                                sx={{ color: "#1A1817" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {item.status === "APPROVED" && (
                              <Tooltip title="View Product Page">
                                <IconButton
                                  size="small"
                                  component={RouterLink}
                                  to={`/store/product/${item._id}`}
                                  target="_blank"
                                  sx={{ color: "#D1A362" }}
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Archive Listing">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setProductToArchive(item);
                                  setArchiveDialogOpen(true);
                                }}
                                sx={{ color: "text.secondary" }}
                              >
                                <ArchiveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* Modal: Cancel Order Modal */}
        <Dialog
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#D32F2F" }}>
            Cancel Order #{orderToCancel?.fulfilmentOrderNumber}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Are you sure you want to cancel this shipment? A valid cancellation reason is required for platform audit.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Cancellation Reason"
              placeholder="e.g. Item damaged during quality check, out of stock, size defect..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCancelModalOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
              Back
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleSubmitCancel}
              disabled={orderActionLoading || !cancelReason.trim()}
              sx={{ fontWeight: 700, textTransform: "none" }}
            >
              {orderActionLoading ? <CircularProgress size={20} color="inherit" /> : "Confirm Cancellation"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Seller Order Audit Timeline Modal */}
        <Dialog
          open={orderTimelineOpen}
          onClose={() => setOrderTimelineOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            Fulfilment #{selectedSellerOrder?.fulfilmentOrderNumber} — Status Timeline
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            {selectedSellerOrder && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                    State Transition Audit History
                  </Typography>
                  {selectedSellerOrder.statusHistory && selectedSellerOrder.statusHistory.length > 0 ? (
                    <Stack spacing={1.5}>
                      {selectedSellerOrder.statusHistory.map((h, hIdx) => (
                        <Paper key={hIdx} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FAF9F7" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={h.status} size="small" sx={{ fontWeight: 700 }} />
                              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                                By: {h.changedByName || h.role} ({h.role})
                              </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {new Date(h.changedAt).toLocaleString("en-IN")}
                            </Typography>
                          </Stack>
                          {h.note && (
                            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontSize: "0.85rem" }}>
                              {h.note}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      Initial state: {selectedSellerOrder.status}
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOrderTimelineOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* =========================================================================
            TAB 3: DEDICATED INVENTORY MANAGEMENT TOOL
            ========================================================================= */}
        {activeTab === "inventory" && (
          <Box>
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif' }}>
                Inventory & Stock Management
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Make real-time stock updates across all products and size/colour variants. Negative stock is strictly
                prevented.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ border: "1px solid #ECE7DE", borderRadius: 2, overflow: "hidden" }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: "#FAF8F5" }}>
                  <TableRow>
                    <TableCell sx={{ width: 40 }} />
                    <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Condition</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Purchase Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Stock Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Stock Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Quick Update</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        No products available to manage inventory.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((item) => {
                      const currentStock = inventoryStockMap[item._id]?.stockQuantity ?? item.stockQuantity;
                      const hasVariants = item.variants && item.variants.length > 0;
                      const isExpanded = expandedInventoryRow === item._id;

                      return (
                        <>
                          <TableRow key={item._id} hover>
                            <TableCell>
                              {hasVariants && (
                                <IconButton
                                  size="small"
                                  onClick={() => setExpandedInventoryRow(isExpanded ? null : item._id)}
                                >
                                  {isExpanded ? <ArrowUpIcon /> : <ArrowDownIcon />}
                                </IconButton>
                              )}
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                  src={item.images?.[0]}
                                  variant="rounded"
                                  sx={{ width: 44, height: 50, bgcolor: "#FAF8F5" }}
                                />
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {item.title}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    {item.category} {hasVariants ? `• ${item.variants.length} variant(s)` : ""}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.condition === "PRE_OWNED" ? "Pre-loved" : "Brand New"}
                                size="small"
                                sx={{
                                  bgcolor: item.condition === "PRE_OWNED" ? "#FFF8E1" : "#E8F5E9",
                                  color: item.condition === "PRE_OWNED" ? "#F57F17" : "#2E7D32",
                                  fontWeight: 700,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                ₹{item.price?.toLocaleString("en-IN")}
                              </Typography>
                            </TableCell>
                            <TableCell>{getStockBadge(currentStock)}</TableCell>
                            <TableCell>
                              {/* Stock Adjuster */}
                              <Stack direction="row" spacing={1} alignItems="center">
                                <IconButton
                                  size="small"
                                  disabled={currentStock <= 0}
                                  onClick={() => handleInventoryStockChange(item._id, -1)}
                                  sx={{ bgcolor: "#F5F5F5" }}
                                >
                                  <MinusIcon fontSize="small" />
                                </IconButton>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={currentStock}
                                  onChange={(e) => handleInventoryDirectInput(item._id, e.target.value)}
                                  inputProps={{ min: 0, style: { textAlign: "center", width: 60 } }}
                                  sx={{ "& .MuiOutlinedInput-input": { py: 0.75 } }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleInventoryStockChange(item._id, 1)}
                                  sx={{ bgcolor: "#F5F5F5" }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={
                                  inventoryUpdatingId === item._id ? (
                                    <CircularProgress size={14} color="inherit" />
                                  ) : (
                                    <SaveIcon fontSize="small" />
                                  )
                                }
                                disabled={inventoryUpdatingId === item._id}
                                onClick={() => handleSaveInventory(item._id)}
                                sx={{
                                  bgcolor: "#1A1817",
                                  color: "#D1A362",
                                  textTransform: "none",
                                  fontWeight: 700,
                                  borderRadius: 1.5,
                                  "&:hover": { bgcolor: "#2C2825" },
                                }}
                              >
                                Update
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Variant Sub-Table */}
                          {hasVariants && (
                            <TableRow>
                              <TableCell colSpan={7} sx={{ p: 0, bgcolor: "#FAF8F5" }}>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <Box sx={{ p: 2.5, pl: 6 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                                      Variant Breakdown for &quot;{item.title}&quot;
                                    </Typography>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                                          <TableCell sx={{ fontWeight: 700 }}>Colour</TableCell>
                                          <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                          <TableCell sx={{ fontWeight: 700 }}>Variant Stock</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {item.variants.map((v, vIdx) => (
                                          <TableRow key={vIdx}>
                                            <TableCell>{v.size || "Free Size"}</TableCell>
                                            <TableCell>{v.color || "Standard"}</TableCell>
                                            <TableCell>{v.sku || "N/A"}</TableCell>
                                            <TableCell>{getStockBadge(v.stockQuantity)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* Modal: Cancel Order Modal */}
        <Dialog
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#D32F2F" }}>
            Cancel Order #{orderToCancel?.fulfilmentOrderNumber}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Are you sure you want to cancel this shipment? A valid cancellation reason is required for platform audit.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Cancellation Reason"
              placeholder="e.g. Item damaged during quality check, out of stock, size defect..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCancelModalOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
              Back
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleSubmitCancel}
              disabled={orderActionLoading || !cancelReason.trim()}
              sx={{ fontWeight: 700, textTransform: "none" }}
            >
              {orderActionLoading ? <CircularProgress size={20} color="inherit" /> : "Confirm Cancellation"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Seller Order Audit Timeline Modal */}
        <Dialog
          open={orderTimelineOpen}
          onClose={() => setOrderTimelineOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            Fulfilment #{selectedSellerOrder?.fulfilmentOrderNumber} — Status Timeline
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            {selectedSellerOrder && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                    State Transition Audit History
                  </Typography>
                  {selectedSellerOrder.statusHistory && selectedSellerOrder.statusHistory.length > 0 ? (
                    <Stack spacing={1.5}>
                      {selectedSellerOrder.statusHistory.map((h, hIdx) => (
                        <Paper key={hIdx} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FAF9F7" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={h.status} size="small" sx={{ fontWeight: 700 }} />
                              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                                By: {h.changedByName || h.role} ({h.role})
                              </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {new Date(h.changedAt).toLocaleString("en-IN")}
                            </Typography>
                          </Stack>
                          {h.note && (
                            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontSize: "0.85rem" }}>
                              {h.note}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      Initial state: {selectedSellerOrder.status}
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOrderTimelineOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* =========================================================================
            TAB 4: STORE PROFILE & SETTINGS
            ========================================================================= */}
        {activeTab === "profile" && (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF", maxWidth: 900 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, fontFamily: '"Playfair Display", Georgia, serif' }}>
              Storefront Branding & Customer Policies
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
              Customize your public store banner, brand logo, dispatch timelines, and customer contacts.
            </Typography>

            <form onSubmit={handleSaveStoreProfile}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Store Name"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Public Origin City"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Store Description / About the Atelier"
                    value={storeForm.description}
                    onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                    placeholder="Tell fashion shoppers about your collections, design heritage, or curated vintage pieces..."
                  />
                </Grid>

                {/* Logo & Banner URLs / Uploads */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Store Logo Image URL"
                    value={storeForm.logo}
                    onChange={(e) => setStoreForm({ ...storeForm, logo: e.target.value })}
                    helperText="Square 1:1 image recommended"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            id="store-logo-file"
                            onChange={(e) => handleFileUpload(e, "storeLogo")}
                          />
                          <label htmlFor="store-logo-file">
                            <IconButton component="span" size="small" disabled={imageUploadLoading}>
                              <UploadIcon fontSize="small" />
                            </IconButton>
                          </label>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {storeForm.logo && (
                    <Box sx={{ mt: 1 }}>
                      <Avatar src={storeForm.logo} sx={{ width: 48, height: 48 }} />
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Store Banner Image URL"
                    value={storeForm.banner}
                    onChange={(e) => setStoreForm({ ...storeForm, banner: e.target.value })}
                    helperText="Wide 16:9 or 3:1 banner image recommended"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            id="store-banner-file"
                            onChange={(e) => handleFileUpload(e, "storeBanner")}
                          />
                          <label htmlFor="store-banner-file">
                            <IconButton component="span" size="small" disabled={imageUploadLoading}>
                              <UploadIcon fontSize="small" />
                            </IconButton>
                          </label>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                    Shipping & Delivery Policies
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Min Dispatch Days"
                    value={storeForm.estimatedDaysMin}
                    onChange={(e) => setStoreForm({ ...storeForm, estimatedDaysMin: e.target.value })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Dispatch Days"
                    value={storeForm.estimatedDaysMax}
                    onChange={(e) => setStoreForm({ ...storeForm, estimatedDaysMax: e.target.value })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Standard Shipping Fee (₹)"
                    value={storeForm.standardShippingFee}
                    onChange={(e) => setStoreForm({ ...storeForm, standardShippingFee: e.target.value })}
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Shipping & Packaging Notes"
                    value={storeForm.policyDetails}
                    onChange={(e) => setStoreForm({ ...storeForm, policyDetails: e.target.value })}
                    placeholder="E.g., Dispatched in archival protective garment bags via tracked express carrier."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                    Public Customer Contacts & Social Links
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Email"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Instagram Handle"
                    value={storeForm.instagram}
                    onChange={(e) => setStoreForm({ ...storeForm, instagram: e.target.value })}
                    placeholder="@atelier_official"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Official Website"
                    value={storeForm.website}
                    onChange={(e) => setStoreForm({ ...storeForm, website: e.target.value })}
                    placeholder="https://..."
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={savingStore}
                    sx={{
                      bgcolor: "#1A1817",
                      color: "#D1A362",
                      fontWeight: 700,
                      textTransform: "none",
                      px: 4,
                      py: 1.25,
                      borderRadius: 2,
                      "&:hover": { bgcolor: "#2C2825" },
                    }}
                  >
                    {savingStore ? <CircularProgress size={20} color="inherit" /> : "Save Store Settings"}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        )}

        {/* =========================================================================
            TAB 5: SELLER FINANCES & IMMUTABLE LEDGER
            ========================================================================= */}
        {activeTab === "finances" && (
          <Box>
            {/* Safety & Internal Ledger Notice */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 4,
                borderRadius: 2,
                border: "1px solid #D1A362",
                bgcolor: "#FAF8F5",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <ShieldIcon sx={{ color: "#B8860B", fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                  Seller Financial Ledger Mode
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  All figures represent accumulated internal ledger balances for fulfilled orders. Live bank payouts and automated transfers are disabled in sandbox mode.
                </Typography>
              </Box>
            </Paper>

            {/* Financial Overview Cards */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    GROSS ITEM SALES
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817", mt: 0.5 }}>
                    ₹{Number(sellerFinances?.grossItemSales || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Total fulfilled merchandise
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    COMMISSION DEDUCTED
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#E65100", mt: 0.5 }}>
                    -₹{Number(sellerFinances?.commissionDeductions || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Platform fee (10%)
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    SHIPPING REIMBURSED
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#0288D1", mt: 0.5 }}>
                    +₹{Number(sellerFinances?.shippingReimbursements || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    100% courier pass-through
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    REFUND ADJUSTMENTS
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#D32F2F", mt: 0.5 }}>
                    -₹{Number(sellerFinances?.refundAdjustments || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Returns & deductions
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    NET PAYABLE BALANCE
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#B8860B", mt: 0.5 }}>
                    ₹{Number(sellerFinances?.netPayableAmount || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Internal ledger balance
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Seller Immutable Ledger Table */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', mb: 1 }}>
                Store Sales & Ledger Audit History
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                Double-entry immutable audit trail for your store orders, commissions, shipping fees, and refunds.
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#FAF8F5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Entry ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fulfilment Order #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Direction</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Net Impact</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sellerLedger.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                        No ledger transactions recorded yet. Once customers place and pay for orders, financial entries will appear here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sellerLedger.map((entry) => (
                      <TableRow key={entry._id} hover>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "text.secondary" }}>
                          {entry.entryId}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entry.type}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              bgcolor:
                                entry.type === "SALE"
                                  ? "#E8F5E9"
                                  : entry.type === "COMMISSION"
                                  ? "#FFF3E0"
                                  : entry.type === "REFUND"
                                  ? "#FFEBEE"
                                  : "#E1F5FE",
                              color:
                                entry.type === "SALE"
                                  ? "#2E7D32"
                                  : entry.type === "COMMISSION"
                                  ? "#E65100"
                                  : entry.type === "REFUND"
                                  ? "#C62828"
                                  : "#0277BD",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{entry.fulfilmentOrderNumber}</TableCell>
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: entry.direction === "CREDIT" ? "#2E7D32" : "#C62828",
                            }}
                          >
                            {entry.direction}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>₹{Number(entry.amount).toLocaleString()}</TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            color: entry.netSellerImpact >= 0 ? "#2E7D32" : "#C62828",
                          }}
                        >
                          {entry.netSellerImpact >= 0 ? `+₹${entry.netSellerImpact}` : `-₹${Math.abs(entry.netSellerImpact)}`}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                          {entry.description}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* =========================================================================
            TAB 6: SELLER STORE ORDERS & FULFILMENT TRACKING
            ========================================================================= */}
        {activeTab === "orders" && (
          <Box>
            {/* Fulfilment Metrics Overview Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={2}>
                <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    TOTAL ORDERS
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817", mt: 0.5 }}>
                    {ordersCounts.ALL}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Assigned to your boutique
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: ordersCounts.ORDER_PLACED > 0 ? "1px solid #1976D2" : "1px solid #ECE7DE",
                    bgcolor: ordersCounts.ORDER_PLACED > 0 ? "#E3F2FD" : "#FFFFFF",
                  }}
                >
                  <Typography variant="caption" sx={{ color: ordersCounts.ORDER_PLACED > 0 ? "#1565C0" : "text.secondary", fontWeight: 700 }}>
                    NEEDS ACCEPTANCE
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: ordersCounts.ORDER_PLACED > 0 ? "#1565C0" : "#1A1817", mt: 0.5 }}>
                    {ordersCounts.ORDER_PLACED}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Awaiting confirmation
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    CONFIRMED
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#512DA8", mt: 0.5 }}>
                    {ordersCounts.CONFIRMED}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Ready for packaging
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    PACKAGING / PREP
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#F57F17", mt: 0.5 }}>
                    {ordersCounts.PROCESSING}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    In processing
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    IN TRANSIT
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#00796B", mt: 0.5 }}>
                    {ordersCounts.SHIPPED}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    With courier partner
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    DELIVERED
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#2E7D32", mt: 0.5 }}>
                    {ordersCounts.DELIVERED}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Successfully completed
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Filter Chips & Search Bar */}
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {[
                      { key: "ALL", label: `All (${ordersCounts.ALL})` },
                      { key: "ORDER_PLACED", label: `New Placed (${ordersCounts.ORDER_PLACED})` },
                      { key: "CONFIRMED", label: `Confirmed (${ordersCounts.CONFIRMED})` },
                      { key: "PROCESSING", label: `Processing (${ordersCounts.PROCESSING})` },
                      { key: "SHIPPED", label: `Shipped (${ordersCounts.SHIPPED})` },
                      { key: "DELIVERED", label: `Delivered (${ordersCounts.DELIVERED})` },
                      { key: "CANCELLED", label: `Cancelled (${ordersCounts.CANCELLED})` },
                    ].map((f) => (
                      <Chip
                        key={f.key}
                        label={f.label}
                        clickable
                        onClick={() => setOrdersFilter(f.key)}
                        sx={{
                          fontWeight: 700,
                          bgcolor: ordersFilter === f.key ? "#1A1817" : "#FAF8F5",
                          color: ordersFilter === f.key ? "#D1A362" : "#1A1817",
                          border: "1px solid #ECE7DE",
                          mb: 0.5,
                        }}
                      />
                    ))}
                  </Stack>
                </Grid>

                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by Fulfilment #, AWB, or Customer..."
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Orders Cards Stack */}
            {ordersLoading ? (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Loading your boutique&apos;s fulfilment orders...
                </Typography>
              </Box>
            ) : sellerOrders.length === 0 ? (
              <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                <ShippingIcon sx={{ fontSize: 48, color: "#ECE7DE", mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1817" }}>
                  No fulfilment orders found
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Orders placed by customers for your store will appear here automatically once payment is verified.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2.5}>
                {sellerOrders.map((order) => {
                  const isPlaced = order.status === "ORDER_PLACED";
                  const isConfirmed = order.status === "CONFIRMED";
                  const isProcessing = order.status === "PROCESSING";
                  const isShipped = order.status === "SHIPPED" || order.status === "DISPATCHED";
                  const isDelivered = order.status === "DELIVERED";
                  const isCancelled = order.status === "CANCELLED";

                  return (
                    <Paper
                      key={order._id}
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 2.5,
                        border: "1px solid #ECE7DE",
                        bgcolor: "#FFFFFF",
                      }}
                    >
                      {/* Order Header */}
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        spacing={1.5}
                        sx={{ pb: 2, borderBottom: "1px solid #F0ECE4", mb: 2 }}
                      >
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                            Fulfilment #{order.fulfilmentOrderNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Parent Order: #{order.parentOrderNumber} • Placed on{" "}
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={order.status === "DISPATCHED" ? "SHIPPED" : order.status}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              bgcolor:
                                isPlaced
                                  ? "#E3F2FD"
                                  : isConfirmed
                                  ? "#EDE7F6"
                                  : isProcessing
                                  ? "#FFF8E1"
                                  : isShipped
                                  ? "#E0F2F1"
                                  : isDelivered
                                  ? "#E8F5E9"
                                  : "#FFEBEE",
                              color:
                                isPlaced
                                  ? "#1565C0"
                                  : isConfirmed
                                  ? "#512DA8"
                                  : isProcessing
                                  ? "#F57F17"
                                  : isShipped
                                  ? "#00796B"
                                  : isDelivered
                                  ? "#2E7D32"
                                  : "#C62828",
                            }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenTimeline(order)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: 1.5,
                              borderColor: "#ECE7DE",
                              color: "#1A1817",
                            }}
                          >
                            Timeline &amp; Audit
                          </Button>
                        </Stack>
                      </Stack>

                      {/* Content Grid: Items & Delivery Details */}
                      <Grid container spacing={3}>
                        {/* Column 1: Items in this Fulfilment */}
                        <Grid item xs={12} md={7}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1 }}>
                            Items in this Shipment ({order.items?.length || 0})
                          </Typography>
                          <Stack spacing={1.5}>
                            {order.items?.map((item, itIdx) => (
                              <Stack key={itIdx} direction="row" spacing={2} alignItems="center">
                                <Box
                                  component="img"
                                  src={item.image || "https://placehold.co/60x80?text=Item"}
                                  alt={item.title}
                                  sx={{
                                    width: 50,
                                    height: 65,
                                    objectFit: "cover",
                                    borderRadius: 1,
                                    border: "1px solid #ECE7DE",
                                  }}
                                />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                                    {item.title}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    {item.size ? `Size: ${item.size} • ` : ""}
                                    {item.color ? `Color: ${item.color} • ` : ""}
                                    Qty: <strong>{item.quantity}</strong> • ₹{item.unitPrice} each
                                  </Typography>
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                  ₹{item.totalPrice}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>

                          {/* Tracking Details Banner if Shipped */}
                          {order.dispatchDetails?.trackingNumber && (
                            <Box sx={{ mt: 2.5, p: 2, bgcolor: "#FAF9F7", borderRadius: 2, border: "1px solid #ECE7DE" }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 0.5 }}>
                                Courier &amp; Tracking Details
                              </Typography>
                              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                                Courier: <strong>{order.dispatchDetails.courierName || "Express Courier"}</strong> • AWB:{" "}
                                <strong>{order.dispatchDetails.trackingNumber}</strong>
                                {order.dispatchDetails.trackingUrl && (
                                  <Button
                                    component="a"
                                    href={order.dispatchDetails.trackingUrl}
                                    target="_blank"
                                    size="small"
                                    sx={{ ml: 1, textTransform: "none", fontWeight: 700, color: "#D1A362" }}
                                  >
                                    Live Tracking ↗
                                  </Button>
                                )}
                              </Typography>
                              {order.dispatchDetails.dispatchedAt && (
                                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                                  Dispatched: {new Date(order.dispatchDetails.dispatchedAt).toLocaleDateString("en-IN")}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Grid>

                        {/* Column 2: Customer Delivery Address & Financial Total */}
                        <Grid item xs={12} md={5}>
                          <Paper elevation={0} sx={{ p: 2, bgcolor: "#FAF9F7", borderRadius: 2, border: "1px solid #ECE7DE", mb: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                              Customer Delivery Address
                            </Typography>
                            {order.deliveryAddress ? (
                              <Typography variant="body2" sx={{ color: "#1A1817", fontSize: "0.85rem", lineHeight: 1.5 }}>
                                <strong>{order.deliveryAddress.name}</strong><br />
                                {order.deliveryAddress.houseNo ? `${order.deliveryAddress.houseNo}, ` : ""}
                                {order.deliveryAddress.street}<br />
                                {order.deliveryAddress.city}, {order.deliveryAddress.state} — {order.deliveryAddress.pincode}<br />
                                Phone: <strong>+91 {order.deliveryAddress.phone}</strong>
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Address details unavailable.
                              </Typography>
                            )}
                          </Paper>

                          {/* Financial Totals */}
                          <Box sx={{ px: 1, mb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Merchandise Subtotal:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                ₹{order.subtotal?.toLocaleString()}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Courier Shipping Fee:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                ₹{order.shippingFee?.toLocaleString()}
                              </Typography>
                            </Stack>
                            <Divider sx={{ my: 1 }} />
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                Total Shipment Amount:
                              </Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                                ₹{order.totalAmount?.toLocaleString()}
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Action Buttons Container */}
                          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                            {isPlaced && (
                              <>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleOpenCancelModal(order)}
                                  disabled={orderActionLoading}
                                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
                                >
                                  Decline / Cancel
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleConfirmOrder(order)}
                                  disabled={orderActionLoading}
                                  sx={{
                                    bgcolor: "#1A1817",
                                    color: "#D1A362",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    borderRadius: 1.5,
                                    px: 2,
                                    "&:hover": { bgcolor: "#2C2825" },
                                  }}
                                >
                                  Accept &amp; Confirm Order
                                </Button>
                              </>
                            )}

                            {isConfirmed && (
                              <>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleOpenCancelModal(order)}
                                  disabled={orderActionLoading}
                                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
                                >
                                  Cancel Order
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleMarkProcessing(order)}
                                  disabled={orderActionLoading}
                                  sx={{
                                    bgcolor: "#1A1817",
                                    color: "#D1A362",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    borderRadius: 1.5,
                                    px: 2,
                                    "&:hover": { bgcolor: "#2C2825" },
                                  }}
                                >
                                  Start Packaging
                                </Button>
                              </>
                            )}

                            {isProcessing && (
                              <>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleOpenCancelModal(order)}
                                  disabled={orderActionLoading}
                                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
                                >
                                  Cancel Order
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleOpenShipModal(order)}
                                  disabled={orderActionLoading}
                                  sx={{
                                    bgcolor: "#1A1817",
                                    color: "#D1A362",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    borderRadius: 1.5,
                                    px: 2,
                                    "&:hover": { bgcolor: "#2C2825" },
                                  }}
                                >
                                  Dispatch &amp; Ship Order
                                </Button>
                              </>
                            )}

                            {isShipped && (
                              <Button
                                variant="contained"
                                size="small"
                                color="success"
                                onClick={() => handleMarkDelivered(order)}
                                disabled={orderActionLoading}
                                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5, px: 2 }}
                              >
                                Mark Delivered
                              </Button>
                            )}
                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

        {/* Modal: Dispatch & Ship Modal */}
        <Dialog
          open={shipModalOpen}
          onClose={() => setShipModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            Dispatch Order #{orderToShip?.fulfilmentOrderNumber}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Stack spacing={2.5}>
              <FormControl fullWidth required>
                <InputLabel>Courier Partner</InputLabel>
                <Select
                  label="Courier Partner"
                  value={shipForm.courierName}
                  onChange={(e) => setShipForm({ ...shipForm, courierName: e.target.value })}
                >
                  <MenuItem value="Blue Dart">Blue Dart Express</MenuItem>
                  <MenuItem value="Delhivery">Delhivery</MenuItem>
                  <MenuItem value="DTDC">DTDC Logistics</MenuItem>
                  <MenuItem value="India Post">India Post (Speed Post)</MenuItem>
                  <MenuItem value="Shiprocket">Shiprocket</MenuItem>
                  <MenuItem value="Ekart Logistics">Ekart Logistics</MenuItem>
                  <MenuItem value="Shadowfax">Shadowfax</MenuItem>
                  <MenuItem value="FedEx">FedEx Express</MenuItem>
                  <MenuItem value="Other Express Courier">Other Courier</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="AWB / Tracking Number"
                placeholder="e.g. BD123456789IN"
                value={shipForm.trackingNumber}
                onChange={(e) => setShipForm({ ...shipForm, trackingNumber: e.target.value })}
                required
                helperText="Provide the official consignment number for customer tracking."
              />

              <TextField
                fullWidth
                label="Custom Tracking Webpage URL (Optional)"
                placeholder="https://..."
                value={shipForm.trackingUrl}
                onChange={(e) => setShipForm({ ...shipForm, trackingUrl: e.target.value })}
                helperText="Leave empty to auto-generate standard tracking URL."
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Dispatch Date"
                    value={shipForm.dispatchedAt}
                    onChange={(e) => setShipForm({ ...shipForm, dispatchedAt: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Estimated Delivery (Optional)"
                    value={shipForm.estimatedDelivery}
                    onChange={(e) => setShipForm({ ...shipForm, estimatedDelivery: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Dispatch Note (Optional)"
                placeholder="Fragile packaging, gift wrapped, tamper bag #..."
                value={shipForm.note}
                onChange={(e) => setShipForm({ ...shipForm, note: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShipModalOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitShip}
              disabled={orderActionLoading || !shipForm.courierName || !shipForm.trackingNumber}
              sx={{
                bgcolor: "#1A1817",
                color: "#D1A362",
                fontWeight: 700,
                textTransform: "none",
                px: 3,
                "&:hover": { bgcolor: "#2C2825" },
              }}
            >
              {orderActionLoading ? <CircularProgress size={20} color="inherit" /> : "Confirm Shipment"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Cancel Order Modal */}
        <Dialog
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#D32F2F" }}>
            Cancel Order #{orderToCancel?.fulfilmentOrderNumber}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Are you sure you want to cancel this shipment? A valid cancellation reason is required for platform audit.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Cancellation Reason"
              placeholder="e.g. Item damaged during quality check, out of stock, size defect..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCancelModalOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
              Back
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleSubmitCancel}
              disabled={orderActionLoading || !cancelReason.trim()}
              sx={{ fontWeight: 700, textTransform: "none" }}
            >
              {orderActionLoading ? <CircularProgress size={20} color="inherit" /> : "Confirm Cancellation"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Seller Order Audit Timeline Modal */}
        <Dialog
          open={orderTimelineOpen}
          onClose={() => setOrderTimelineOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            Fulfilment #{selectedSellerOrder?.fulfilmentOrderNumber} — Status Timeline
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            {selectedSellerOrder && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                    State Transition Audit History
                  </Typography>
                  {selectedSellerOrder.statusHistory && selectedSellerOrder.statusHistory.length > 0 ? (
                    <Stack spacing={1.5}>
                      {selectedSellerOrder.statusHistory.map((h, hIdx) => (
                        <Paper key={hIdx} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FAF9F7" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={h.status} size="small" sx={{ fontWeight: 700 }} />
                              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                                By: {h.changedByName || h.role} ({h.role})
                              </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {new Date(h.changedAt).toLocaleString("en-IN")}
                            </Typography>
                          </Stack>
                          {h.note && (
                            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontSize: "0.85rem" }}>
                              {h.note}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      Initial state: {selectedSellerOrder.status}
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOrderTimelineOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* =========================================================================
            ADD / EDIT PRODUCT MODAL
            ========================================================================= */}
        <Dialog
          open={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', pb: 1 }}>
            {editingProduct ? `Edit Listing: ${editingProduct.title}` : "Add New Fashion Product Listing"}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            {/* Warning if editing approved item */}
            {editingProduct && editingProduct.status === "APPROVED" && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>Important Moderation Notice:</strong> Modifying key fields (title, price, brand, category,
                condition, images) will automatically queue this listing for administrator review before changes go live
                publicly.
              </Alert>
            )}

            {/* Notice if editing rejected item */}
            {editingProduct && editingProduct.status === "REJECTED" && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <strong>Admin Rejection Feedback:</strong> {editingProduct.adminReviewNotes || "Please review and revise the listing details."}
                <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                  Once you have corrected the details below, click &quot;Submit for Review&quot; to resubmit.
                </Typography>
              </Alert>
            )}

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Product Title"
                  name="title"
                  value={productForm.title}
                  onChange={handleProductFormChange}
                  required
                  placeholder="e.g. Handcrafted Zardozi Silk Sherwani"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Brand / Designer"
                  name="brand"
                  value={productForm.brand}
                  onChange={handleProductFormChange}
                  placeholder="e.g. Sabyasachi, Self-Designed"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    label="Category"
                    name="category"
                    value={productForm.category}
                    onChange={handleProductFormChange}
                  >
                    {Object.keys(CATEGORIES_DATA).map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Subcategory</InputLabel>
                  <Select
                    label="Subcategory"
                    name="subcategory"
                    value={productForm.subcategory}
                    onChange={handleProductFormChange}
                  >
                    {(CATEGORIES_DATA[productForm.category] || []).map((sub) => (
                      <MenuItem key={sub} value={sub}>
                        {sub}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Detailed Product Description"
                  name="description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  required
                  placeholder="Fabric, craftsmanship, weaving technique, styling notes, exact dimensions..."
                />
              </Grid>

              {/* Condition Section */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Product Condition</InputLabel>
                  <Select
                    label="Product Condition"
                    name="condition"
                    value={productForm.condition}
                    onChange={handleProductFormChange}
                  >
                    <MenuItem value="NEW">Brand New (Pristine, unworn)</MenuItem>
                    <MenuItem value="PRE_OWNED">Pre-loved / Pre-Owned (Gently used)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Purchase Price (₹)"
                  name="price"
                  value={productForm.price}
                  onChange={handleProductFormChange}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Original Retail Price / MRP (₹ Optional)"
                  name="originalRetailPrice"
                  value={productForm.originalRetailPrice}
                  onChange={handleProductFormChange}
                  inputProps={{ min: 0 }}
                  helperText={
                    productForm.originalRetailPrice && Number(productForm.originalRetailPrice) > Number(productForm.price)
                      ? `${Math.round(
                          ((Number(productForm.originalRetailPrice) - Number(productForm.price)) /
                            Number(productForm.originalRetailPrice)) *
                            100
                        )}% OFF customer discount badge`
                      : "Optional original price to show discount"
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Base Stock Quantity"
                  name="stockQuantity"
                  value={productForm.stockQuantity}
                  onChange={handleProductFormChange}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>

              {/* Pre-owned Disclosures */}
              {productForm.condition === "PRE_OWNED" && (
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{ p: 2.5, bgcolor: "#FFFDF9", border: "1px solid #FFE082", borderRadius: 2 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#B78103", mb: 1 }}>
                      Mandatory Pre-Loved Disclosures
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
                      Transparent disclosures build buyer trust. State how many times it was worn, any alterations, and
                      disclose any tiny defect or thread pull honestly.
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Condition Disclosure Details"
                      name="conditionDescription"
                      value={productForm.conditionDescription}
                      onChange={handleProductFormChange}
                      required
                      placeholder="E.g., Worn once for 3 hours. Dry-cleaned. Minor micro-thread pull near hem, not visible when draped."
                    />

                    {/* Defect Images */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
                        Flaw or Wear Photographs (Optional but recommended):
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Paste defect image URL or upload below..."
                          value={productForm.defectUrlInput}
                          onChange={(e) => setProductForm({ ...productForm, defectUrlInput: e.target.value })}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleAddImageUrl("defect")}
                          sx={{ textTransform: "none", fontWeight: 700 }}
                        >
                          Add URL
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          id="defect-file-upload"
                          onChange={(e) => handleFileUpload(e, "defectImages")}
                        />
                        <label htmlFor="defect-file-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            size="small"
                            startIcon={<UploadIcon />}
                            disabled={imageUploadLoading}
                            sx={{ textTransform: "none", fontWeight: 700 }}
                          >
                            Upload
                          </Button>
                        </label>
                      </Stack>
                      {/* Defect preview chips */}
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {productForm.defectImages.map((img, idx) => (
                          <Chip
                            key={idx}
                            label={`Flaw Photo ${idx + 1}`}
                            onDelete={() => handleRemoveImage("defect", idx)}
                            size="small"
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {/* Product Photos Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                  Product Photographs (At least 1 required)
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Enter image URL or choose file to upload..."
                    value={productForm.imageUrlInput}
                    onChange={(e) => setProductForm({ ...productForm, imageUrlInput: e.target.value })}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleAddImageUrl("product")}
                    sx={{ textTransform: "none", fontWeight: 700, borderColor: "#D1A362", color: "#1A1817" }}
                  >
                    Add URL
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    id="product-photo-upload"
                    onChange={(e) => handleFileUpload(e, "productImages")}
                  />
                  <label htmlFor="product-photo-upload">
                    <Button
                      variant="contained"
                      component="span"
                      size="small"
                      startIcon={<UploadIcon />}
                      disabled={imageUploadLoading}
                      sx={{
                        bgcolor: "#1A1817",
                        color: "#D1A362",
                        textTransform: "none",
                        fontWeight: 700,
                        "&:hover": { bgcolor: "#2C2825" },
                      }}
                    >
                      {imageUploadLoading ? "Uploading..." : "Upload Photo"}
                    </Button>
                  </label>
                </Stack>

                {/* Thumbnails grid */}
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  {productForm.images.map((imgUrl, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        position: "relative",
                        width: 72,
                        height: 88,
                        borderRadius: 1.5,
                        overflow: "hidden",
                        border: idx === 0 ? "2px solid #D1A362" : "1px solid #ECE7DE",
                      }}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage("product", idx)}
                        sx={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          bgcolor: "rgba(0,0,0,0.6)",
                          color: "#FFF",
                          p: 0.25,
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      {idx === 0 && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            bgcolor: "#D1A362",
                            color: "#1A1817",
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            textAlign: "center",
                          }}
                        >
                          PRIMARY
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Grid>

              {/* Variants Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Size & Colour Variants (Optional)
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddVariant}
                    sx={{ textTransform: "none", fontWeight: 700, color: "#1A1817" }}
                  >
                    Add Variant
                  </Button>
                </Stack>
                {productForm.variants.map((v, vIdx) => (
                  <Stack key={vIdx} direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <TextField
                      size="small"
                      label="Size"
                      value={v.size}
                      onChange={(e) => handleUpdateVariant(vIdx, "size", e.target.value)}
                      placeholder="e.g. M, 38, Free"
                      sx={{ width: 100 }}
                    />
                    <TextField
                      size="small"
                      label="Colour"
                      value={v.color}
                      onChange={(e) => handleUpdateVariant(vIdx, "color", e.target.value)}
                      placeholder="e.g. Ivory"
                      sx={{ width: 110 }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Stock"
                      value={v.stockQuantity}
                      onChange={(e) => handleUpdateVariant(vIdx, "stockQuantity", e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{ width: 90 }}
                    />
                    <TextField
                      size="small"
                      label="SKU"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(vIdx, "sku", e.target.value)}
                      placeholder="SKU Code"
                      sx={{ flexGrow: 1 }}
                    />
                    <IconButton size="small" onClick={() => handleRemoveVariant(vIdx)} sx={{ color: "error.main" }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setProductModalOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
              Cancel
            </Button>
            <Button
              variant="outlined"
              disabled={submittingProduct}
              onClick={() => handleSaveProduct(true)}
              sx={{ textTransform: "none", fontWeight: 700, borderColor: "#D1A362", color: "#1A1817" }}
            >
              Save as Draft
            </Button>
            <Button
              variant="contained"
              disabled={submittingProduct}
              onClick={() => handleSaveProduct(false)}
              sx={{
                bgcolor: "#1A1817",
                color: "#D1A362",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                "&:hover": { bgcolor: "#2C2825" },
              }}
            >
              {submittingProduct ? (
                <CircularProgress size={20} color="inherit" />
              ) : editingProduct && editingProduct.status === "REJECTED" ? (
                "Resubmit for Review"
              ) : (
                "Submit for Admin Review"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* =========================================================================
            ARCHIVE CONFIRMATION DIALOG
            ========================================================================= */}
        <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>Archive Listing?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Are you sure you want to archive <strong>&quot;{productToArchive?.title}&quot;</strong>? It will no longer
              be visible on your storefront.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setArchiveDialogOpen(false)} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmArchive}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Confirm Archive
            </Button>
          </DialogActions>
        </Dialog>

        {/* Global Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={notification.severity}
            onClose={() => setNotification({ ...notification, open: false })}
            sx={{ fontWeight: 700 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
      <Fotter />
    </Box>
  );
}
