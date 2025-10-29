--
-- KOMPLETTER DATENBANK-DUMP FÜR FIRMA B (WIF)
-- Erstellt alle Tabellen und importiert alle Testdaten von Replit
--

-- 1. SCHEMA (Tabellen erstellen)
--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    ahv_accounting_number text NOT NULL,
    suva_customer_number text,
    ahv_employee_rate numeric(5,4) DEFAULT 5.3000 NOT NULL,
    ahv_employer_rate numeric(5,4) DEFAULT 5.3000 NOT NULL,
    ahv_rentner_allowance numeric(10,2) DEFAULT 1400.00 NOT NULL,
    alv_employee_rate numeric(5,4) DEFAULT 1.1000 NOT NULL,
    alv_employer_rate numeric(5,4) DEFAULT 1.1000 NOT NULL,
    alv_max_income_per_year numeric(10,2) DEFAULT 148200.00 NOT NULL,
    alv_employee_2_rate numeric(5,4) DEFAULT 0.5000 NOT NULL,
    alv_employer_2_rate numeric(5,4) DEFAULT 0.5000 NOT NULL,
    suva_nbu_male_rate numeric(5,4) DEFAULT 1.1680 NOT NULL,
    suva_nbu_female_rate numeric(5,4) DEFAULT 1.1680 NOT NULL,
    suva_max_income_per_year numeric(10,2) DEFAULT 148200.00 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    street text NOT NULL,
    postal_code text NOT NULL,
    city text NOT NULL,
    payroll_sender_email text,
    ktg_gav_rate numeric(5,4) DEFAULT 1.5150 NOT NULL,
    berufsbeitrag_gav_rate numeric(5,4) DEFAULT 0.4000 NOT NULL,
    thirteenth_month_rate numeric(5,4) DEFAULT 8.3300 NOT NULL,
    vacation_compensation_rate numeric(5,4) DEFAULT 8.3300 NOT NULL,
    vacation_rate numeric(5,4) DEFAULT 3.2000 NOT NULL
);


--
-- Name: deductions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deductions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    payroll_payment_id character varying NOT NULL,
    type text NOT NULL,
    description text,
    percentage numeric(5,4),
    base_amount numeric(10,2),
    amount numeric(10,2) NOT NULL,
    is_auto_calculated boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    birth_date date NOT NULL,
    email text NOT NULL,
    entry_date date NOT NULL,
    exit_date date,
    ahv_number text NOT NULL,
    has_accident_insurance boolean DEFAULT true NOT NULL,
    has_ahv boolean DEFAULT true NOT NULL,
    has_alv boolean DEFAULT true NOT NULL,
    bank_name text NOT NULL,
    bank_iban text NOT NULL,
    bank_bic text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_nbu_insured boolean DEFAULT true NOT NULL,
    is_rentner boolean DEFAULT false NOT NULL,
    monthly_salary numeric(10,2),
    employment_level numeric(5,2),
    hourly_rate numeric(10,2),
    bvg_deduction_amount numeric(10,2),
    bvg_deduction_percentage numeric(5,2),
    child_allowance_amount numeric(10,2),
    child_allowance_note text,
    gender text DEFAULT 'Mann'::text NOT NULL,
    street text NOT NULL,
    postal_code text NOT NULL,
    city text NOT NULL,
    annual_flat_expenses numeric(10,2),
    ktg_gav_percentage numeric(5,4),
    berufsbeitrag_gav_percentage numeric(5,4),
    has_ktg_gav boolean DEFAULT false NOT NULL,
    has_berufsbeitrag_gav boolean DEFAULT false NOT NULL
);


--
-- Name: payroll_item_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_item_types (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    subject_to_ahv boolean DEFAULT true NOT NULL,
    subject_to_alv boolean DEFAULT true NOT NULL,
    subject_to_nbu boolean DEFAULT true NOT NULL,
    subject_to_bvg boolean DEFAULT true NOT NULL,
    subject_to_qst boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: payroll_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    payroll_payment_id character varying NOT NULL,
    type text NOT NULL,
    description text,
    amount numeric(10,2) NOT NULL,
    hours numeric(8,2),
    hourly_rate numeric(10,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: payroll_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id character varying NOT NULL,
    payment_date date NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    payment_month integer NOT NULL,
    payment_year integer NOT NULL,
    gross_salary numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_deductions numeric(10,2) DEFAULT 0.00 NOT NULL,
    net_salary numeric(10,2) DEFAULT 0.00 NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_locked boolean DEFAULT false NOT NULL
);


--
-- Name: payroll_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    items text NOT NULL,
    deductions text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: deductions deductions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deductions
    ADD CONSTRAINT deductions_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: payroll_item_types payroll_item_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_item_types
    ADD CONSTRAINT payroll_item_types_pkey PRIMARY KEY (id);


--
-- Name: payroll_items payroll_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_items
    ADD CONSTRAINT payroll_items_pkey PRIMARY KEY (id);


--
-- Name: payroll_payments payroll_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_payments
    ADD CONSTRAINT payroll_payments_pkey PRIMARY KEY (id);


--
-- Name: payroll_templates payroll_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_templates
    ADD CONSTRAINT payroll_templates_pkey PRIMARY KEY (id);


--
-- Name: deductions deductions_payroll_payment_id_payroll_payments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deductions
    ADD CONSTRAINT deductions_payroll_payment_id_payroll_payments_id_fk FOREIGN KEY (payroll_payment_id) REFERENCES public.payroll_payments(id) ON DELETE CASCADE;


--
-- Name: employees employees_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: payroll_item_types payroll_item_types_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_item_types
    ADD CONSTRAINT payroll_item_types_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: payroll_items payroll_items_payroll_payment_id_payroll_payments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_items
    ADD CONSTRAINT payroll_items_payroll_payment_id_payroll_payments_id_fk FOREIGN KEY (payroll_payment_id) REFERENCES public.payroll_payments(id) ON DELETE CASCADE;


--
-- Name: payroll_payments payroll_payments_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_payments
    ADD CONSTRAINT payroll_payments_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


-- 2. DATEN (Testdaten importieren)

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.companies VALUES ('fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Test AG', '123456789', '', 5.3000, 5.3000, 1400.00, 1.1000, 1.1000, 148200.00, 0.5000, 0.5000, 1.1680, 1.1680, 148200.00, '2025-10-21 15:46:49.238196', '2025-10-27 15:42:24.724', 'Teststrasse 123', '8000', 'Zuerich', '', 1.5150, 0.4000, 8.3300, 8.3300, 2.3000);


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.employees VALUES ('d4c1f973-5019-4382-a6c0-f4b9fbfd77c1', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Ali', 'Meier', '1995-09-05', 'thomas.meier@example.ch', '2023-02-01', NULL, '756.5678.9012.31', true, true, true, 'Basler Kantonalbank', 'CH28 0077 0016 0123 4567 8', '', true, '2025-10-21 19:10:26.633937', '2025-10-23 18:54:24.631', true, false, 6100.00, NULL, NULL, 407.05, NULL, 430.00, '2 Kinder', 'Mann', 'Musterstrasse 40', '6000', 'Luzern', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('fcc500f2-7106-408e-9420-51ae3cbd460f', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Floren', 'Rudo', '1984-05-21', '', '2025-01-01', NULL, '', true, true, true, '', '', '', true, '2025-10-23 18:10:14.934071', '2025-10-23 18:10:14.934071', true, false, NULL, NULL, 35.00, NULL, NULL, NULL, '', 'Mann', 'Musterstrasse 89', '8000', 'Zürich', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('d0cd17c3-a5f8-4690-9d74-476024fa71d5', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Richard', 'Weber', '1988-05-18', 'maria.weber@example.ch', '2022-03-10', NULL, '756.4567.8901.20', true, true, true, 'BCV Lausanne', 'CH51 0076 7000 0123 4567 8', '', true, '2025-10-21 19:10:26.633937', '2025-10-25 10:00:05.673', false, false, 185.00, NULL, NULL, NULL, 0.00, 0.00, '', 'Mann', 'Musterstrasse 72', '3000', 'Bern', 2400.00, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('0196b9b5-85e4-4568-887b-892b84293743', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Gregor', 'Xaver', '1988-05-18', 'richard.staubli@hispeed.ch', '2022-03-10', NULL, '756.4567.8901.20', true, true, true, 'BCV Lausanne', 'CH51 0076 7000 0123 4567 8', '', true, '2025-10-22 19:10:54.877227', '2025-10-25 19:16:51.963', true, false, 8400.00, NULL, NULL, 434.70, NULL, NULL, '', 'Mann', 'Musterstrasse 47', '8000', 'Zürich', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('6c61f21a-2473-4092-a1ae-6768ef8e6434', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Anja', 'Payroll', '1990-01-01', 'test.payroll@example.com', '2025-01-01', NULL, '756.9999.8888.77', true, true, true, 'Test Bank', 'CH93 0076 2011 6238 5295 7', '', true, '2025-10-22 08:50:16.377746', '2025-10-23 18:54:24.303', true, false, 12100.00, 100.00, 35.50, 823.05, 4.50, NULL, '', 'Frau', 'Beispielstrasse 10', '8001', 'Zürich', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('e4fb3d9c-382e-456b-a57a-ac6467d8b6ad', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Dorothea', 'Zumsteg', '1970-05-18', 'richard.staubli@wifpartner.ch', '2022-03-10', NULL, '756.4567.8901.20', true, true, true, 'BCV Lausanne', 'CH51 0076 7000 0123 4567 8', '', true, '2025-10-22 19:11:17.534545', '2025-10-26 06:27:40.258', true, false, 11000.00, 65.00, 45.50, 581.75, NULL, NULL, '', 'Frau', 'Musterstrasse 73', '3000', 'Bern', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('f42b2929-a30e-4c09-90ce-dd9d10dc913c', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Max', 'Mustermann', '1990-01-15', 'test@example.com', '2024-01-01', NULL, '756.1234.5678.90', true, true, true, '', '', '', true, '2025-10-25 09:37:15.934246', '2025-10-26 20:25:33.12', true, false, NULL, NULL, NULL, NULL, NULL, NULL, '', 'Mann', 'Musterstrasse 456', '3000', 'Bern', NULL, NULL, NULL, true, true);
INSERT INTO public.employees VALUES ('e70a6b9f-100d-4659-bd44-ce43ee40ee87', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Moritz', 'Morise', '1990-01-01', 'moritz.morise@example.com', '2025-10-01', NULL, '756.1234.5888.88', true, true, true, 'Bank (bitte aktualisieren)', 'CH00 0000 0000 0000 0000 0', NULL, true, '2025-10-26 21:19:48.641678', '2025-10-26 21:19:48.641678', true, false, NULL, NULL, 42.00, NULL, 5.88, NULL, NULL, 'Mann', 'Buchstrasse 45', '8000', 'Zürich', NULL, 1.5150, 0.4000, true, true);
INSERT INTO public.employees VALUES ('2f3f58b7-9afa-46e9-bc32-66034aa5f854', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Josef', 'Müller', '1985-05-15', 'hans.mueller@example.com', '2024-01-01', NULL, '756.1234.5678.97', true, true, true, 'UBS Zürich', 'CH93 0076 2011 6238 5295 7', '', true, '2025-10-21 15:48:28.222451', '2025-10-22 19:08:23.186', true, false, NULL, NULL, NULL, NULL, NULL, NULL, '', 'Mann', 'Musterstrasse 33', '6000', 'Luzern', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('3b4e4f85-640c-4d58-b151-64a1fce999f8', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Nadine', 'Mike', '1995-09-05', 'thomas.meier@example.ch', '2023-02-01', NULL, '756.5678.9012.31', true, true, true, 'Basler Kantonalbank', 'CH28 0077 0016 0123 4567 8', '', true, '2025-10-23 06:16:09.533056', '2025-10-23 06:25:05.065', true, false, 0.00, NULL, 40.00, 0.00, NULL, 0.00, '', 'Frau', 'Musterstrasse 38', '8000', 'Zürich', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('bc051b8a-51b2-4b71-a148-6f6b59ec4d1c', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Loris', 'Anberg', '1972-06-12', '', '2025-09-01', NULL, '', true, true, true, '', '', '', true, '2025-10-24 19:10:31.445811', '2025-10-24 19:37:29.188', true, false, 10000.00, NULL, NULL, 813.40, NULL, 536.00, '2 Kinder (268 CHF je Kind)', 'Mann', 'Musterstrasse 74', '6000', 'Luzern', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('8d968254-f409-4b57-b8cc-066fac4470c3', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Michelle', 'Müller', '1985-03-15', 'hans.mueller@example.ch', '2020-01-01', NULL, '756.1234.5678.97', true, true, true, 'UBS Zürich', 'CH93 0076 2011 6238 5295 7', '', true, '2025-10-21 19:10:26.633937', '2025-10-23 06:18:38.499', true, false, NULL, NULL, 40.00, NULL, NULL, NULL, '', 'Frau', 'Musterstrasse 68', '6000', 'Luzern', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('6040804e-9cfe-4b74-bc41-cd7666cf7240', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Fatime', 'Nunez', '1964-10-09', '', '2025-01-01', NULL, '', true, true, true, '', '', '', true, '2025-10-23 18:09:09.785584', '2025-10-23 18:13:23.08', true, false, NULL, NULL, 28.00, NULL, 0.00, NULL, '', 'Frau', 'Musterstrasse 100', '8000', 'Zürich', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('9c38602b-27aa-4368-b2d8-e95bf27e8e86', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Lukas', 'Straub', '1990-01-01', 'lukas.straub@example.com', '2025-10-01', NULL, '756.8905.1234.56', true, true, true, 'Bank (bitte aktualisieren)', 'CH00 0000 0000 0000 0000 0', NULL, true, '2025-10-27 15:43:17.407886', '2025-10-27 15:43:17.407886', true, false, NULL, NULL, 32.54, NULL, 4.38, NULL, NULL, 'Mann', 'Baslerstrasse 56', '8800', 'Thalwil', NULL, 1.5150, 0.4000, true, true);
INSERT INTO public.employees VALUES ('05f4ed1e-95b2-4b15-8c6c-2cd9271ffb91', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Chrisoph', 'Pizzol', '1985-05-15', 'hans.mueller@example.com', '2024-01-01', NULL, '756.1234.5678.97', true, true, true, 'UBS Zürich', 'CH93 0076 2011 6238 5295 7', '', true, '2025-10-22 19:08:45.728243', '2025-10-23 18:54:24.3', true, false, 9231.25, 80.00, NULL, 388.70, NULL, NULL, '', 'Mann', 'Musterstrasse 87', '8000', 'Zürich', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('43b541e4-a011-4961-b31e-215d5adf8d33', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Patric', 'Test', '1985-05-15', 'bvg.test@example.com', '2025-01-01', NULL, '756.5555.4444.33', true, true, true, 'ZKB Zürich', 'CH10 0070 0110 0023 8529 5', '', true, '2025-10-22 09:03:24.379537', '2025-10-23 18:54:24.298', true, false, 7450.00, NULL, NULL, 524.85, NULL, NULL, '', 'Mann', 'Musterstrasse 84', '3000', 'Bern', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('e524bc79-4ff6-4361-ab2c-00f7f1b77e6d', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Dritta', 'Schmidt', '1975-03-12', '', '2025-01-01', NULL, '', true, true, true, '', '', '', true, '2025-10-23 07:17:42.110008', '2025-10-23 07:32:44.022', true, false, NULL, NULL, 35.00, NULL, 0.00, NULL, '', 'Frau', 'Musterstrasse 86', '3000', 'Bern', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('f2e1823e-019c-49a2-9a65-916dcb7fe25d', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Christoph', 'Kinder', '1988-03-15', 'maria.kinder@example.com', '2025-01-01', NULL, '756.2222.3333.44', true, true, true, 'Raiffeisen Bank', 'CH56 0077 8110 0012 3456 0', '', true, '2025-10-22 09:13:04.046749', '2025-10-23 18:54:24.307', true, false, 8450.00, 80.00, NULL, 510.65, NULL, 0.00, '', 'Mann', 'Musterstrasse 20', '8000', 'Zürich', NULL, NULL, NULL, false, false);
INSERT INTO public.employees VALUES ('474387fa-ce9a-475d-b98c-09b4faedf7e0', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', 'Rudolf', 'Muster', '1985-06-20', 'hans.muster@example.com', '2025-01-01', NULL, '756.1111.2222.33', true, true, true, 'UBS Zürich', 'CH93 0076 2011 6238 5295 7', '', true, '2025-10-22 09:23:26.77306', '2025-10-25 10:00:04.603', false, false, 185.00, NULL, NULL, NULL, 0.00, 0.00, '', 'Mann', 'Musterstrasse 66', '6000', 'Luzern', 3600.00, NULL, NULL, false, false);


--
-- Data for Name: payroll_payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payroll_payments VALUES ('6925a954-b56c-4837-b99a-8edfd3548a51', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-25', '2025-11-01', '2025-11-30', 11, 2025, 400000.00, 22303.15, 377696.85, '', '2025-10-25 07:25:20.137926', '2025-10-25 19:13:25.422', true);
INSERT INTO public.payroll_payments VALUES ('e8d5bd65-58a0-44e9-846d-665694b07427', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-01-01', '2024-01-01', '2024-01-31', 1, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:21.717558', '2025-10-26 07:34:21.717558', false);
INSERT INTO public.payroll_payments VALUES ('f5f4a0b7-812b-4023-b734-d08e423ad4dc', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-02-01', '2024-02-01', '2024-02-29', 2, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:21.99253', '2025-10-26 07:34:21.99253', false);
INSERT INTO public.payroll_payments VALUES ('6bb88fb7-79cb-4aef-8f8d-9daeee5268c4', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-03-01', '2024-03-01', '2024-03-31', 3, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:22.248093', '2025-10-26 07:34:22.248093', false);
INSERT INTO public.payroll_payments VALUES ('b7cf170a-833b-4b96-aae6-81085f6b15f7', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-04-01', '2024-04-01', '2024-04-30', 4, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:22.503205', '2025-10-26 07:34:22.503205', false);
INSERT INTO public.payroll_payments VALUES ('e6dd6de0-645d-4c46-b887-446a8fb66373', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-05-01', '2024-05-01', '2024-05-31', 5, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:22.758112', '2025-10-26 07:34:22.758112', false);
INSERT INTO public.payroll_payments VALUES ('cbdce295-2f42-4b76-b3c1-c48319f14c83', 'd4c1f973-5019-4382-a6c0-f4b9fbfd77c1', '2025-09-30', '2025-09-01', '2025-09-30', 9, 2025, 6530.00, 868.70, 5661.30, 'Monatslohn September', '2025-10-21 19:11:26.795918', '2025-10-25 06:33:46.318', true);
INSERT INTO public.payroll_payments VALUES ('a0490d83-45cb-4259-adca-76fa94524230', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-06-01', '2024-06-01', '2024-06-30', 6, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:22.885665', '2025-10-26 07:34:22.885665', false);
INSERT INTO public.payroll_payments VALUES ('25a9bc57-a581-405a-8b0b-2a34f2a2f2b3', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-07-01', '2024-07-01', '2024-07-31', 7, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:23.012978', '2025-10-26 07:34:23.012978', false);
INSERT INTO public.payroll_payments VALUES ('55f76df0-1ee1-4e01-a935-929548ebd60c', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-08-01', '2024-08-01', '2024-08-31', 8, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:23.140156', '2025-10-26 07:34:23.140156', false);
INSERT INTO public.payroll_payments VALUES ('5f509e3e-2217-4a3f-a64b-9a3b9e6a5338', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-09-01', '2024-09-01', '2024-09-30', 9, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:23.267269', '2025-10-26 07:34:23.267269', false);
INSERT INTO public.payroll_payments VALUES ('f05dd307-cd60-4bb2-9787-5827e9f632a2', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-10-01', '2024-10-01', '2024-10-31', 10, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:23.394875', '2025-10-26 07:34:23.394875', false);
INSERT INTO public.payroll_payments VALUES ('0188fed5-1a9d-43e3-bd46-89fb68974708', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-11-01', '2024-11-01', '2024-11-30', 11, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:23.522416', '2025-10-26 07:34:23.522416', false);
INSERT INTO public.payroll_payments VALUES ('aa9aa027-5836-4add-9006-d6a229dfdc45', 'f42b2929-a30e-4c09-90ce-dd9d10dc913c', '2024-12-01', '2024-12-01', '2024-12-31', 12, 2024, 15000.00, 0.00, 0.00, NULL, '2025-10-26 07:34:23.650277', '2025-10-26 07:34:23.650277', false);
INSERT INTO public.payroll_payments VALUES ('b8e8a246-0548-4957-9427-dadc5b7d3490', 'f2e1823e-019c-49a2-9a65-916dcb7fe25d', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 6760.00, 1022.25, 5737.75, '', '2025-10-24 13:55:30.111599', '2025-10-24 14:02:00.917', true);
INSERT INTO public.payroll_payments VALUES ('6facba06-e49d-470a-a3db-38385853de66', '8d968254-f409-4b57-b8cc-066fac4470c3', '2025-10-21', '2025-12-01', '2025-12-31', 12, 2025, 5000.00, 553.40, 4446.60, '', '2025-10-21 20:21:36.152698', '2025-10-21 20:21:36.152698', false);
INSERT INTO public.payroll_payments VALUES ('14a2fb00-adc3-45d4-ade7-2c4e75841564', 'f2e1823e-019c-49a2-9a65-916dcb7fe25d', '2025-10-22', '2025-12-01', '2025-12-31', 12, 2025, 5950.00, 658.55, 5291.45, '', '2025-10-22 09:17:14.1785', '2025-10-22 09:17:14.1785', false);
INSERT INTO public.payroll_payments VALUES ('f5f7e642-8f4f-4ed5-aaa4-3c1bcd3516d1', '3b4e4f85-640c-4d58-b151-64a1fce999f8', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 780.00, 59.03, 720.97, '', '2025-10-23 07:25:31.161855', '2025-10-23 18:49:24.224', true);
INSERT INTO public.payroll_payments VALUES ('ca1d48ac-09fb-4af6-a8a2-3a34f0403a21', 'e524bc79-4ff6-4361-ab2c-00f7f1b77e6d', '2025-10-23', '2025-01-01', '2025-01-31', 1, 2025, 210.00, 15.89, 194.11, '', '2025-10-23 07:23:09.434432', '2025-10-23 18:49:03.316', true);
INSERT INTO public.payroll_payments VALUES ('158d139a-79c3-49d0-a06e-f1baf73d85c3', '43b541e4-a011-4961-b31e-215d5adf8d33', '2025-10-23', '2025-01-01', '2025-01-31', 1, 2025, 7300.00, 1071.21, 6228.79, '', '2025-10-23 06:28:59.85573', '2025-10-23 18:49:05.163', true);
INSERT INTO public.payroll_payments VALUES ('80a67758-08f6-48de-96ac-03ba6ec3de75', '05f4ed1e-95b2-4b15-8c6c-2cd9271ffb91', '2025-10-23', '2025-01-01', '2025-01-31', 1, 2025, 7385.00, 866.55, 6518.45, '', '2025-10-23 06:30:41.881485', '2025-10-23 18:49:06.044', true);
INSERT INTO public.payroll_payments VALUES ('604cf41d-61ac-439e-a3b5-70d263102de2', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-23', '2025-01-01', '2025-01-31', 1, 2025, 12100.00, 1724.28, 10375.72, '', '2025-10-23 06:27:44.495283', '2025-10-23 18:49:06.914', true);
INSERT INTO public.payroll_payments VALUES ('e374f8ab-3bcb-4675-916e-617dfd985dd9', 'e4fb3d9c-382e-456b-a57a-ac6467d8b6ad', '2025-10-23', '2025-01-01', '2025-01-31', 1, 2025, 7150.00, 1086.21, 6063.79, '', '2025-10-23 06:33:38.578317', '2025-10-23 18:49:07.665', true);
INSERT INTO public.payroll_payments VALUES ('2acf929b-f040-45f1-aeba-d1260b57cdc7', '0196b9b5-85e4-4568-887b-892b84293743', '2025-10-23', '2025-01-01', '2025-01-31', 1, 2025, 8300.00, 1062.24, 7237.76, '', '2025-10-23 06:32:48.801699', '2025-10-23 18:49:08.687', true);
INSERT INTO public.payroll_payments VALUES ('10850448-1f21-4c15-b950-2316c7a21661', '3b4e4f85-640c-4d58-b151-64a1fce999f8', '2025-10-23', '2025-01-01', '2025-01-31', 1, 2025, 583.20, 44.14, 539.06, '', '2025-10-23 06:25:56.71804', '2025-10-23 18:49:09.546', true);
INSERT INTO public.payroll_payments VALUES ('0a33fe8a-c6fa-4f3d-ba30-f3bd5a0cc7f9', 'd4c1f973-5019-4382-a6c0-f4b9fbfd77c1', '2025-10-23', '2025-01-01', '2025-01-31', 1, 2025, 6391.00, 745.12, 5645.88, '', '2025-10-23 06:20:20.589748', '2025-10-23 18:49:10.494', true);
INSERT INTO public.payroll_payments VALUES ('782e0c96-6eb9-42ef-a51b-3c07f1d43bad', '9c38602b-27aa-4368-b2d8-e95bf27e8e86', '2025-10-27', '2025-10-27', '2025-10-27', 10, 2025, 348.50, 48.30, 300.20, NULL, '2025-10-27 16:03:54.726447', '2025-10-27 16:03:54.726447', false);
INSERT INTO public.payroll_payments VALUES ('29d859eb-13d6-4b9c-8547-f036d41fb2ae', '9c38602b-27aa-4368-b2d8-e95bf27e8e86', '2025-10-26', '2025-10-26', '2025-10-26', 10, 2025, 227.71, 31.56, 196.15, NULL, '2025-10-27 16:05:46.23017', '2025-10-27 16:05:46.23017', false);
INSERT INTO public.payroll_payments VALUES ('c9800081-ebbd-4da0-bb06-532b5f1a9ebd', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-23', '2025-02-01', '2025-02-28', 2, 2025, 12100.00, 1738.78, 10361.22, '', '2025-10-23 19:54:28.561974', '2025-10-23 19:54:28.561974', false);
INSERT INTO public.payroll_payments VALUES ('4c53bca3-05a1-4fb6-84d3-a9d3c8c86500', '43b541e4-a011-4961-b31e-215d5adf8d33', '2025-10-23', '2025-02-01', '2025-02-28', 2, 2025, 12100.00, 1440.58, 10659.42, '', '2025-10-23 20:19:48.357904', '2025-10-24 11:40:09.075', false);
INSERT INTO public.payroll_payments VALUES ('f6c9b0e1-dea1-4c83-ae70-86536a433962', 'd4c1f973-5019-4382-a6c0-f4b9fbfd77c1', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 6530.00, 868.70, 5661.30, '', '2025-10-24 13:56:03.310503', '2025-10-24 14:01:40.111', true);
INSERT INTO public.payroll_payments VALUES ('02f60db0-1049-4d4a-a086-0a55bf8c6c02', '0196b9b5-85e4-4568-887b-892b84293743', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 8400.00, 1070.41, 7329.59, '', '2025-10-24 13:59:56.813492', '2025-10-24 14:01:42.05', true);
INSERT INTO public.payroll_payments VALUES ('c1ae8ce6-cc1e-42f1-b9a7-c5c0857dd504', 'd0cd17c3-a5f8-4690-9d74-476024fa71d5', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 585.00, 11.84, 573.16, '', '2025-10-24 13:59:45.579846', '2025-10-24 14:01:43.633', true);
INSERT INTO public.payroll_payments VALUES ('27695b25-e40b-4bf2-9d04-7f562f3e1359', 'e4fb3d9c-382e-456b-a57a-ac6467d8b6ad', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 7150.00, 1122.86, 6027.14, NULL, '2025-10-25 06:22:51.533427', '2025-10-26 12:10:59.021', true);
INSERT INTO public.payroll_payments VALUES ('a27f83e7-f85c-4f19-8af0-de82e7603ffe', 'e70a6b9f-100d-4659-bd44-ce43ee40ee87', '2025-10-22', '2025-10-22', '2025-10-22', 10, 2025, 166.60, 25.60, 141.00, NULL, '2025-10-26 21:27:23.006892', '2025-10-26 21:27:23.006892', false);
INSERT INTO public.payroll_payments VALUES ('f63ea30f-d178-46b5-b49a-7d7bb056e117', '9c38602b-27aa-4368-b2d8-e95bf27e8e86', '2025-10-26', '2025-10-26', '2025-10-26', 10, 2025, 230.51, 31.96, 198.55, NULL, '2025-10-27 16:06:31.313234', '2025-10-27 16:06:31.313234', false);
INSERT INTO public.payroll_payments VALUES ('29bc390b-a16b-472e-b9c5-74ed994306fe', 'fcc500f2-7106-408e-9420-51ae3cbd460f', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 105.00, 7.95, 97.05, NULL, '2025-10-25 06:22:18.729782', '2025-10-25 06:31:46.312', true);
INSERT INTO public.payroll_payments VALUES ('54080893-ad3f-4958-b6cb-2bcefadbbf37', '0196b9b5-85e4-4568-887b-892b84293743', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 8400.00, 1070.41, 7329.59, '', '2025-10-25 06:22:42.660717', '2025-10-25 06:31:47.547', true);
INSERT INTO public.payroll_payments VALUES ('2fba9dd2-f500-4ab0-9bd4-da87589cadc8', 'd0cd17c3-a5f8-4690-9d74-476024fa71d5', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 585.00, 11.84, 573.16, '', '2025-10-25 06:22:30.43733', '2025-10-25 06:31:48.033', true);
INSERT INTO public.payroll_payments VALUES ('eaabc451-ea95-4b28-be40-d823e40c9f62', '05f4ed1e-95b2-4b15-8c6c-2cd9271ffb91', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 7385.00, 947.60, 6437.40, '', '2025-10-25 06:21:33.16417', '2025-10-25 06:31:48.501', true);
INSERT INTO public.payroll_payments VALUES ('33b3ec03-d668-43a3-9494-5cc5a9e843c5', 'e524bc79-4ff6-4361-ab2c-00f7f1b77e6d', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 105.00, 7.95, 97.05, NULL, '2025-10-25 06:22:04.602331', '2025-10-25 06:31:49.911', true);
INSERT INTO public.payroll_payments VALUES ('bb108261-5be2-4c43-9fd5-09924c68af69', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 12100.00, 1744.45, 10355.55, '', '2025-10-24 21:21:01.793012', '2025-10-25 06:33:35.7', true);
INSERT INTO public.payroll_payments VALUES ('f92ff264-e35e-4847-b10f-ffc185969658', 'd4c1f973-5019-4382-a6c0-f4b9fbfd77c1', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 6530.00, 868.70, 5661.30, '', '2025-10-24 16:36:03.593398', '2025-10-24 17:35:13.138', true);
INSERT INTO public.payroll_payments VALUES ('c17cf0d1-2cc5-47b3-8ea4-7a9682b5bebb', 'e4fb3d9c-382e-456b-a57a-ac6467d8b6ad', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 7150.00, 1122.86, 6027.14, '', '2025-10-24 16:56:32.614342', '2025-10-24 17:35:15.751', true);
INSERT INTO public.payroll_payments VALUES ('9149bc93-6bf1-406f-a281-b44878b2ff4f', '6040804e-9cfe-4b74-bc41-cd7666cf7240', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 392.00, 29.67, 362.33, '', '2025-10-24 16:54:01.911759', '2025-10-24 17:35:16.804', true);
INSERT INTO public.payroll_payments VALUES ('d5d8276e-1784-4fbe-9cb2-5c07399a834a', 'fcc500f2-7106-408e-9420-51ae3cbd460f', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 245.00, 18.54, 226.46, '', '2025-10-24 16:52:41.375306', '2025-10-24 17:35:17.846', true);
INSERT INTO public.payroll_payments VALUES ('ed2f294f-84d1-4b9c-867e-d247f53f680f', '474387fa-ce9a-475d-b98c-09b4faedf7e0', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 585.00, 11.84, 573.16, '', '2025-10-25 06:31:03.592239', '2025-10-25 06:31:49.121', true);
INSERT INTO public.payroll_payments VALUES ('530af5f6-0624-43b5-89e6-a244f6679347', '43b541e4-a011-4961-b31e-215d5adf8d33', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 7450.00, 1088.67, 6361.33, '', '2025-10-25 06:26:42.479089', '2025-10-25 06:31:51.478', true);
INSERT INTO public.payroll_payments VALUES ('54e54da0-72dd-46c3-887a-6efeb04e1d0a', 'f2e1823e-019c-49a2-9a65-916dcb7fe25d', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 6760.00, 1022.25, 5737.75, '', '2025-10-25 06:28:29.064547', '2025-10-25 06:31:54.836', true);
INSERT INTO public.payroll_payments VALUES ('d5b0f70a-321d-4917-811f-e1d172c74201', '6040804e-9cfe-4b74-bc41-cd7666cf7240', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 392.00, 29.67, 362.33, '', '2025-10-25 06:29:40.729656', '2025-10-25 06:31:56.069', true);
INSERT INTO public.payroll_payments VALUES ('1c1386f3-39f0-4217-bc5a-b81e7e93d170', 'd4c1f973-5019-4382-a6c0-f4b9fbfd77c1', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 6530.00, 868.70, 5661.30, '', '2025-10-25 06:28:41.279096', '2025-10-25 06:31:57.12', true);
INSERT INTO public.payroll_payments VALUES ('2b43321d-6233-416a-8f5a-d71f1e12635e', '3b4e4f85-640c-4d58-b151-64a1fce999f8', '2025-10-25', '2025-08-01', '2025-08-31', 8, 2025, 320.00, 24.22, 295.78, '', '2025-10-25 06:30:48.66149', '2025-10-25 06:31:58.25', true);
INSERT INTO public.payroll_payments VALUES ('64fb118b-22bb-4372-9e9f-20eb662b4529', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-25', '2025-10-01', '2025-10-31', 10, 2025, 12100.00, 1744.45, 10355.55, '', '2025-10-25 06:35:21.12075', '2025-10-25 06:39:44.193', true);
INSERT INTO public.payroll_payments VALUES ('8f84c35f-f77d-418a-92b9-cc1e3cfb2519', 'f2e1823e-019c-49a2-9a65-916dcb7fe25d', '2025-10-22', '2025-01-01', '2025-01-31', 1, 2025, 6668.00, 1014.73, 5653.27, '', '2025-10-22 19:22:00.910311', '2025-10-23 18:49:13.002', true);
INSERT INTO public.payroll_payments VALUES ('41c6c9c6-cb6c-4072-a3a4-3ca4c3d056f4', '05f4ed1e-95b2-4b15-8c6c-2cd9271ffb91', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 7385.00, 866.55, 6518.45, '', '2025-10-23 07:31:00.093802', '2025-10-23 18:49:20.398', true);
INSERT INTO public.payroll_payments VALUES ('f0d2289b-e3e4-4e46-8202-30bb43d3faec', 'd0cd17c3-a5f8-4690-9d74-476024fa71d5', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 585.00, 11.84, 573.16, '', '2025-10-23 07:58:30.37066', '2025-10-23 18:49:21.521', true);
INSERT INTO public.payroll_payments VALUES ('3e861e79-ec2b-4452-b087-2f1626600930', '0196b9b5-85e4-4568-887b-892b84293743', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 8300.00, 1062.24, 7237.76, '', '2025-10-23 07:59:33.266275', '2025-10-23 18:49:22.184', true);
INSERT INTO public.payroll_payments VALUES ('b2f98e90-2f6e-4814-8689-0a33b665cbcd', 'e4fb3d9c-382e-456b-a57a-ac6467d8b6ad', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 7150.00, 1086.21, 6063.79, '', '2025-10-23 07:59:47.327225', '2025-10-23 18:49:22.743', true);
INSERT INTO public.payroll_payments VALUES ('8178b4a4-0549-4889-9fea-c9d5a81fc674', 'fcc500f2-7106-408e-9420-51ae3cbd460f', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 350.00, 26.49, 323.51, '', '2025-10-23 18:10:42.143947', '2025-10-23 18:49:23.624', true);
INSERT INTO public.payroll_payments VALUES ('f2778d65-f60a-4c7f-bcbc-bf2343c6caf0', 'f2e1823e-019c-49a2-9a65-916dcb7fe25d', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 6668.00, 1014.73, 5653.27, '', '2025-10-23 07:24:58.645718', '2025-10-23 18:49:24.876', true);
INSERT INTO public.payroll_payments VALUES ('1496d668-7134-48c6-974d-6f0259d6b296', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 12100.00, 1724.28, 10375.72, '', '2025-10-23 07:30:28.836534', '2025-10-23 18:49:25.405', true);
INSERT INTO public.payroll_payments VALUES ('58d7548f-6730-48b9-b838-609ebebca0d0', '43b541e4-a011-4961-b31e-215d5adf8d33', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 7300.00, 1071.21, 6228.79, '', '2025-10-23 07:30:42.485611', '2025-10-23 18:49:26.518', true);
INSERT INTO public.payroll_payments VALUES ('3f4b2234-a67a-4bc1-8d79-5207c9980d69', 'd4c1f973-5019-4382-a6c0-f4b9fbfd77c1', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 6391.00, 745.12, 5645.88, '', '2025-10-23 07:25:12.550437', '2025-10-23 18:49:27.983', true);
INSERT INTO public.payroll_payments VALUES ('12739a89-a58e-4b8d-ad56-88c16aa418b7', 'd4c1f973-5019-4382-a6c0-f4b9fbfd77c1', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 8030.00, 982.22, 7047.78, '', '2025-10-23 18:55:19.929285', '2025-10-24 13:54:39.783', true);
INSERT INTO public.payroll_payments VALUES ('7410c8f2-47ba-4333-8eb1-e88db52723c8', '474387fa-ce9a-475d-b98c-09b4faedf7e0', '2025-10-23', '2025-03-01', '2025-03-31', 3, 2025, 585.00, 11.84, 573.16, '', '2025-10-23 07:29:40.649868', '2025-10-23 18:49:29.188', true);
INSERT INTO public.payroll_payments VALUES ('235cfd93-bfc6-4377-8de3-fbc840cdd1ea', 'f2e1823e-019c-49a2-9a65-916dcb7fe25d', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 8760.00, 1173.61, 7586.39, '', '2025-10-23 18:55:00.772356', '2025-10-24 13:54:49.256', true);
INSERT INTO public.payroll_payments VALUES ('240413f1-1b0a-4bb4-9b91-f96791a4ebd8', '6040804e-9cfe-4b74-bc41-cd7666cf7240', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 392.00, 29.67, 362.33, '', '2025-10-24 13:59:32.819326', '2025-10-24 14:01:45.458', true);
INSERT INTO public.payroll_payments VALUES ('f4df5e5a-cde7-4c58-adc1-9d21e30afcb4', '3b4e4f85-640c-4d58-b151-64a1fce999f8', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 280.00, 21.19, 258.81, '', '2025-10-24 13:56:19.062105', '2025-10-24 14:01:47.14', true);
INSERT INTO public.payroll_payments VALUES ('09b1ab7a-7ff7-481f-b033-2a65b14bd8b1', 'fcc500f2-7106-408e-9420-51ae3cbd460f', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 245.00, 18.54, 226.46, '', '2025-10-24 13:59:09.921898', '2025-10-24 14:01:47.893', true);
INSERT INTO public.payroll_payments VALUES ('3b71fc8f-c799-480f-915c-1db8da91f55d', 'e4fb3d9c-382e-456b-a57a-ac6467d8b6ad', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 7150.00, 1122.86, 6027.14, '', '2025-10-24 14:00:07.498267', '2025-10-24 14:01:48.972', true);
INSERT INTO public.payroll_payments VALUES ('0860cb21-5b46-4911-8b6e-b5afd6d87e26', '05f4ed1e-95b2-4b15-8c6c-2cd9271ffb91', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 7385.00, 947.60, 6437.40, '', '2025-10-24 13:58:37.949733', '2025-10-24 14:01:50.871', true);
INSERT INTO public.payroll_payments VALUES ('f3479479-30e5-492b-aed3-b2e54e606dea', '474387fa-ce9a-475d-b98c-09b4faedf7e0', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 585.00, 11.84, 573.16, '', '2025-10-24 13:56:35.547788', '2025-10-24 14:01:53.013', true);
INSERT INTO public.payroll_payments VALUES ('3646b36d-9b29-4903-8fce-e12a03ec9306', '43b541e4-a011-4961-b31e-215d5adf8d33', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 7450.00, 1088.67, 6361.33, '', '2025-10-24 13:58:22.500782', '2025-10-24 14:01:53.717', true);
INSERT INTO public.payroll_payments VALUES ('c67cf0b6-e8ba-4582-8af2-a1390b76a777', 'e524bc79-4ff6-4361-ab2c-00f7f1b77e6d', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 245.00, 18.54, 226.46, '', '2025-10-24 13:58:59.095175', '2025-10-24 14:01:54.481', true);
INSERT INTO public.payroll_payments VALUES ('4291b0e6-0f92-4ef7-9501-4e23d125bed8', 'e524bc79-4ff6-4361-ab2c-00f7f1b77e6d', '2025-10-24', '2025-03-01', '2025-03-31', 3, 2025, 350.00, 26.49, 323.51, '', '2025-10-24 09:22:19.104351', '2025-10-24 09:26:10.915', true);
INSERT INTO public.payroll_payments VALUES ('e7354a6f-b518-460c-9d86-b5cd97247c6a', '6040804e-9cfe-4b74-bc41-cd7666cf7240', '2025-10-24', '2025-03-01', '2025-03-31', 3, 2025, 392.00, 29.67, 362.33, '', '2025-10-24 09:25:50.25594', '2025-10-24 09:26:13.198', true);
INSERT INTO public.payroll_payments VALUES ('e427fdc9-c18f-48d0-9fd8-007567dfd11f', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-24', '2025-05-01', '2025-05-31', 5, 2025, 12100.00, 1744.45, 10355.55, '', '2025-10-24 15:29:42.835355', '2025-10-24 15:29:42.835355', false);
INSERT INTO public.payroll_payments VALUES ('c029a1b9-4167-403a-90c7-104fe0b0917f', '3b4e4f85-640c-4d58-b151-64a1fce999f8', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 340.00, 25.73, 314.27, '', '2025-10-23 18:55:59.729522', '2025-10-24 13:54:40.551', true);
INSERT INTO public.payroll_payments VALUES ('f023734e-8cdf-4e4f-9be2-a2bc69296dd7', '43b541e4-a011-4961-b31e-215d5adf8d33', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 10450.00, 1315.71, 9134.29, '', '2025-10-23 18:59:55.252727', '2025-10-24 13:54:41.223', true);
INSERT INTO public.payroll_payments VALUES ('c876c17a-cbce-42b4-984e-f156a7cf6a34', 'e524bc79-4ff6-4361-ab2c-00f7f1b77e6d', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 245.00, 18.54, 226.46, '', '2025-10-23 19:00:49.522501', '2025-10-24 13:54:42.198', true);
INSERT INTO public.payroll_payments VALUES ('2c1e2384-37d2-460d-9cfb-f53f3523a088', 'fcc500f2-7106-408e-9420-51ae3cbd460f', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 245.00, 18.54, 226.46, '', '2025-10-23 19:00:59.602316', '2025-10-24 13:54:44.012', true);
INSERT INTO public.payroll_payments VALUES ('8c152fbc-9ca1-42a2-8d0b-fbacfb29c5f1', '6040804e-9cfe-4b74-bc41-cd7666cf7240', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 392.00, 29.67, 362.33, '', '2025-10-23 19:01:23.893028', '2025-10-24 13:54:45.133', true);
INSERT INTO public.payroll_payments VALUES ('06a73ccc-cd23-47e0-904c-1a668d573c1d', 'd0cd17c3-a5f8-4690-9d74-476024fa71d5', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 585.00, 11.84, 573.16, '', '2025-10-23 19:01:40.89199', '2025-10-24 13:54:46.762', true);
INSERT INTO public.payroll_payments VALUES ('46cadb07-c540-413b-ace4-975e0af7d46d', '0196b9b5-85e4-4568-887b-892b84293743', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 10400.00, 1221.77, 9178.23, '', '2025-10-23 19:01:58.449439', '2025-10-24 13:54:47.309', true);
INSERT INTO public.payroll_payments VALUES ('a16d7773-756e-4d42-bbc4-6637779bd3ab', 'e4fb3d9c-382e-456b-a57a-ac6467d8b6ad', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 19150.00, 2031.02, 17118.98, '', '2025-10-23 19:02:25.364447', '2025-10-24 13:54:47.981', true);
INSERT INTO public.payroll_payments VALUES ('696e7051-0499-4d62-a1ec-0e3a285afa78', '474387fa-ce9a-475d-b98c-09b4faedf7e0', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 585.00, 11.84, 573.16, '', '2025-10-23 18:56:24.374072', '2025-10-24 13:54:51.197', true);
INSERT INTO public.payroll_payments VALUES ('b08b3556-85de-4469-b8ca-1fa2a0b4db66', '05f4ed1e-95b2-4b15-8c6c-2cd9271ffb91', '2025-10-23', '2025-04-01', '2025-04-30', 4, 2025, 8885.00, 1061.12, 7823.88, '', '2025-10-23 19:00:26.910346', '2025-10-24 13:54:52.671', true);
INSERT INTO public.payroll_payments VALUES ('0018475c-fdfc-49c0-a84e-7856ee3a8c9e', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-24', '2025-04-01', '2025-04-30', 4, 2025, 30100.00, 2715.46, 27384.54, '', '2025-10-24 08:39:01.177228', '2025-10-24 15:27:59.736', false);
INSERT INTO public.payroll_payments VALUES ('5a129ebc-3cdb-4f7e-a2db-3c294c0121f8', 'e4fb3d9c-382e-456b-a57a-ac6467d8b6ad', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 7150.00, 1122.86, 6027.14, '', '2025-10-24 14:12:18.015118', '2025-10-24 16:33:28.089', true);
INSERT INTO public.payroll_payments VALUES ('b947086a-1e59-4502-88da-ff12ef128331', '3b4e4f85-640c-4d58-b151-64a1fce999f8', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 950.00, 71.90, 878.10, '', '2025-10-24 14:08:55.21091', '2025-10-24 16:33:20.913', true);
INSERT INTO public.payroll_payments VALUES ('fdc160eb-4033-4b59-8480-f58107172ba2', 'fcc500f2-7106-408e-9420-51ae3cbd460f', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 437.50, 33.11, 404.39, '', '2025-10-24 14:11:14.214225', '2025-10-24 16:33:22.851', true);
INSERT INTO public.payroll_payments VALUES ('3933a5c8-67dc-455f-81a3-e053916b8a77', 'd0cd17c3-a5f8-4690-9d74-476024fa71d5', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 585.00, 11.84, 573.16, '', '2025-10-24 14:11:54.810818', '2025-10-24 16:33:23.933', true);
INSERT INTO public.payroll_payments VALUES ('1a12b6eb-5317-4247-a222-9ffebc35282c', '0196b9b5-85e4-4568-887b-892b84293743', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 8400.00, 1070.41, 7329.59, '', '2025-10-24 14:12:08.562403', '2025-10-24 16:33:24.837', true);
INSERT INTO public.payroll_payments VALUES ('42ee7e40-253d-460b-9268-07937fafc38a', 'd4c1f973-5019-4382-a6c0-f4b9fbfd77c1', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 6530.00, 868.70, 5661.30, '', '2025-10-24 14:08:42.892824', '2025-10-24 16:33:25.668', true);
INSERT INTO public.payroll_payments VALUES ('4a19245d-cded-4261-9eed-bd1c0ef39789', '05f4ed1e-95b2-4b15-8c6c-2cd9271ffb91', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 7385.00, 947.60, 6437.40, '', '2025-10-24 14:10:38.72142', '2025-10-24 16:33:26.779', true);
INSERT INTO public.payroll_payments VALUES ('648f345d-1cea-4933-b6a1-5f98f69fa805', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 12100.00, 1744.45, 10355.55, '', '2025-10-24 14:10:13.05514', '2025-10-24 16:33:27.422', true);
INSERT INTO public.payroll_payments VALUES ('390e74c3-0645-4a5d-b0d8-2983f8f06ddf', '6040804e-9cfe-4b74-bc41-cd7666cf7240', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 392.00, 29.67, 362.33, '', '2025-10-24 14:11:43.188281', '2025-10-24 16:33:28.994', true);
INSERT INTO public.payroll_payments VALUES ('8837d1da-bf86-4e51-8248-1bf0849353e6', 'e524bc79-4ff6-4361-ab2c-00f7f1b77e6d', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 437.50, 33.11, 404.39, '', '2025-10-24 14:11:01.792634', '2025-10-24 16:33:31.714', true);
INSERT INTO public.payroll_payments VALUES ('0686ccfd-2d18-4a14-a485-c8aec811450d', '43b541e4-a011-4961-b31e-215d5adf8d33', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 7450.00, 1088.67, 6361.33, '', '2025-10-24 14:10:23.408463', '2025-10-24 16:33:32.284', true);
INSERT INTO public.payroll_payments VALUES ('75e9c271-4c6f-4a6e-bc81-8ed25cbe8b19', '474387fa-ce9a-475d-b98c-09b4faedf7e0', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 585.00, 11.84, 573.16, '', '2025-10-24 14:09:08.825192', '2025-10-24 16:33:32.965', true);
INSERT INTO public.payroll_payments VALUES ('e345bd6b-7b19-4f34-a269-f65bc97e2f70', 'f2e1823e-019c-49a2-9a65-916dcb7fe25d', '2025-10-24', '2025-06-01', '2025-06-30', 6, 2025, 6760.00, 1022.25, 5737.75, '', '2025-10-24 14:08:33.987146', '2025-10-24 16:33:40.928', true);
INSERT INTO public.payroll_payments VALUES ('37aafcd2-69c7-4d12-aa39-2dc346a5ddfd', '3b4e4f85-640c-4d58-b151-64a1fce999f8', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 500.00, 37.84, 462.16, '', '2025-10-24 16:36:32.090322', '2025-10-24 17:35:17.321', true);
INSERT INTO public.payroll_payments VALUES ('eb545dd1-5fca-4c98-b476-ee39af8d97dc', 'f2e1823e-019c-49a2-9a65-916dcb7fe25d', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 6760.00, 1022.25, 5737.75, '', '2025-10-24 16:35:56.226981', '2025-10-24 17:35:31.358', true);
INSERT INTO public.payroll_payments VALUES ('32f45d66-e402-45ca-a7dd-ff9a95bc6785', 'd0cd17c3-a5f8-4690-9d74-476024fa71d5', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 585.00, 11.84, 573.16, '', '2025-10-24 16:56:11.195563', '2025-10-24 17:35:18.349', true);
INSERT INTO public.payroll_payments VALUES ('7f606abf-06a2-41ab-b072-9a2586114246', '0196b9b5-85e4-4568-887b-892b84293743', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 8400.00, 1070.41, 7329.59, '', '2025-10-24 16:56:22.923937', '2025-10-24 17:35:18.884', true);
INSERT INTO public.payroll_payments VALUES ('02c7e1fb-8197-4629-863c-d7f4ef173909', 'e524bc79-4ff6-4361-ab2c-00f7f1b77e6d', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 245.00, 18.54, 226.46, '', '2025-10-24 16:52:28.615566', '2025-10-24 17:35:20.529', true);
INSERT INTO public.payroll_payments VALUES ('bae209f8-8315-476c-9b87-74800d87301e', '43b541e4-a011-4961-b31e-215d5adf8d33', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 7450.00, 1088.67, 6361.33, '', '2025-10-24 16:51:47.195405', '2025-10-24 17:35:21.02', true);
INSERT INTO public.payroll_payments VALUES ('48cf7161-9b35-4cbd-bc64-4738ae6979eb', '474387fa-ce9a-475d-b98c-09b4faedf7e0', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 585.00, 11.84, 573.16, NULL, '2025-10-24 16:36:45.885072', '2025-10-24 17:35:21.471', true);
INSERT INTO public.payroll_payments VALUES ('d42296ea-ae6b-4758-af6a-18ddc4413843', '05f4ed1e-95b2-4b15-8c6c-2cd9271ffb91', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 7385.00, 947.60, 6437.40, '', '2025-10-24 16:51:59.605991', '2025-10-24 17:35:21.931', true);
INSERT INTO public.payroll_payments VALUES ('78058e9e-36c2-473a-ac0a-cdecfd29043b', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-24', '2025-07-01', '2025-07-31', 7, 2025, 12100.00, 1744.45, 10355.55, '', '2025-10-24 16:57:07.376452', '2025-10-24 17:35:22.45', true);
INSERT INTO public.payroll_payments VALUES ('475e230c-343c-4ce9-b18b-04749b245563', '05f4ed1e-95b2-4b15-8c6c-2cd9271ffb91', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 7385.00, 947.60, 6437.40, '', '2025-10-24 19:42:01.775885', '2025-10-25 06:39:35.778', true);
INSERT INTO public.payroll_payments VALUES ('b59ff4da-d0f2-4ef4-be63-978359f01477', '6c61f21a-2473-4092-a1ae-6768ef8e6434', '2025-10-24', '2025-08-01', '2025-08-31', 8, 2025, 12100.00, 1744.45, 10355.55, '', '2025-10-24 16:51:17.897507', '2025-10-25 06:32:04.89', true);
INSERT INTO public.payroll_payments VALUES ('5dcf2d2a-40ec-482f-9297-758d5724c148', 'e524bc79-4ff6-4361-ab2c-00f7f1b77e6d', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 332.50, 25.16, 307.34, '', '2025-10-24 19:07:06.550442', '2025-10-25 06:33:28.258', true);
INSERT INTO public.payroll_payments VALUES ('38b4ae58-e6b5-477d-abb7-ee270a33d936', 'fcc500f2-7106-408e-9420-51ae3cbd460f', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 332.50, 25.16, 307.34, '', '2025-10-24 19:07:55.339134', '2025-10-25 06:33:29.02', true);
INSERT INTO public.payroll_payments VALUES ('140b86bd-11ee-4a72-a45e-0459c82206a9', 'd0cd17c3-a5f8-4690-9d74-476024fa71d5', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 585.00, 11.84, 573.16, '', '2025-10-24 19:08:05.161415', '2025-10-25 06:33:30.35', true);
INSERT INTO public.payroll_payments VALUES ('87ad95d8-0add-426d-a7f0-9ad266865cba', '0196b9b5-85e4-4568-887b-892b84293743', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 8400.00, 1070.41, 7329.59, '', '2025-10-24 19:08:15.981518', '2025-10-25 06:33:31.58', true);
INSERT INTO public.payroll_payments VALUES ('bcb0eb1a-1a38-4e7f-83eb-0c5475c978a5', 'e4fb3d9c-382e-456b-a57a-ac6467d8b6ad', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 7150.00, 1122.86, 6027.14, '', '2025-10-24 19:08:25.439292', '2025-10-25 06:33:32.909', true);
INSERT INTO public.payroll_payments VALUES ('f0c58438-75fe-4491-918d-56211af3f89a', 'bc051b8a-51b2-4b71-a148-6f6b59ec4d1c', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 10000.00, 1570.20, 8429.80, '', '2025-10-24 19:10:59.520438', '2025-10-25 06:33:33.578', true);
INSERT INTO public.payroll_payments VALUES ('05dac079-069a-4b0d-a28b-81706f7478db', '3b4e4f85-640c-4d58-b151-64a1fce999f8', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 1470.00, 111.25, 1358.75, '', '2025-10-24 19:17:23.085888', '2025-10-25 06:33:34.276', true);
INSERT INTO public.payroll_payments VALUES ('33a23499-0a9a-45b7-8bac-42aeeba5923b', '474387fa-ce9a-475d-b98c-09b4faedf7e0', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 585.00, 11.84, 573.16, '', '2025-10-24 19:18:32.861533', '2025-10-25 06:33:34.988', true);
INSERT INTO public.payroll_payments VALUES ('c47ae371-fb0e-4edc-9494-8a2564fe3fd5', '05f4ed1e-95b2-4b15-8c6c-2cd9271ffb91', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 7385.00, 947.60, 6437.40, '', '2025-10-24 19:06:47.314235', '2025-10-25 06:33:36.704', true);
INSERT INTO public.payroll_payments VALUES ('8cf78e3f-b561-47d4-9601-3194ce8f9d03', '43b541e4-a011-4961-b31e-215d5adf8d33', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 7450.00, 1088.67, 6361.33, '', '2025-10-24 19:06:37.314319', '2025-10-25 06:33:37.464', true);
INSERT INTO public.payroll_payments VALUES ('7353d0c5-bc59-4e9e-8aa8-178b63c22823', 'f2e1823e-019c-49a2-9a65-916dcb7fe25d', '2025-10-24', '2025-09-01', '2025-09-30', 9, 2025, 6760.00, 1022.25, 5737.75, '', '2025-10-24 17:17:35.850073', '2025-10-25 06:33:40.024', true);
INSERT INTO public.payroll_payments VALUES ('edbf9083-f907-4ad3-9488-c6b0733ea966', '43b541e4-a011-4961-b31e-215d5adf8d33', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 7450.00, 1088.67, 6361.33, '', '2025-10-24 19:40:05.050565', '2025-10-25 06:39:46.023', true);
INSERT INTO public.payroll_payments VALUES ('8763d986-33f7-4aa4-9ad0-e7b35bfdcab4', '0196b9b5-85e4-4568-887b-892b84293743', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 8400.00, 1070.41, 7329.59, '', '2025-10-24 19:43:07.899975', '2025-10-25 06:39:39.334', true);
INSERT INTO public.payroll_payments VALUES ('dfd12cea-9017-4d88-a0c6-6d868b20235f', 'e524bc79-4ff6-4361-ab2c-00f7f1b77e6d', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 245.00, 18.54, 226.46, '', '2025-10-24 19:42:26.010253', '2025-10-25 06:39:37.106', true);
INSERT INTO public.payroll_payments VALUES ('d5cce845-d95c-4cb2-b0b9-91ef811650fb', 'fcc500f2-7106-408e-9420-51ae3cbd460f', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 245.00, 18.54, 226.46, '', '2025-10-24 19:42:39.687957', '2025-10-25 06:39:38.231', true);
INSERT INTO public.payroll_payments VALUES ('8b796513-dc9e-4a4c-a187-d9141d1b72f8', 'd0cd17c3-a5f8-4690-9d74-476024fa71d5', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 585.00, 11.84, 573.16, '', '2025-10-24 19:42:51.847465', '2025-10-25 06:39:38.95', true);
INSERT INTO public.payroll_payments VALUES ('ac72687b-890c-4dab-a523-271d898f71c6', 'e4fb3d9c-382e-456b-a57a-ac6467d8b6ad', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 7150.00, 1122.86, 6027.14, '', '2025-10-24 19:43:19.333707', '2025-10-25 06:39:40.075', true);
INSERT INTO public.payroll_payments VALUES ('ab740373-1794-4384-a063-0354e3298242', '474387fa-ce9a-475d-b98c-09b4faedf7e0', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 585.00, 11.84, 573.16, '', '2025-10-24 19:39:36.157345', '2025-10-25 06:39:41.855', true);
INSERT INTO public.payroll_payments VALUES ('c9bfab3c-9357-4f8b-8fc1-992367be4be4', '3b4e4f85-640c-4d58-b151-64a1fce999f8', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 1780.00, 134.71, 1645.29, '', '2025-10-24 19:39:20.617541', '2025-10-25 06:39:42.486', true);
INSERT INTO public.payroll_payments VALUES ('15053308-e416-447d-b856-a91b5b9935ff', 'd4c1f973-5019-4382-a6c0-f4b9fbfd77c1', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 6530.00, 868.70, 5661.30, '', '2025-10-24 19:39:04.824186', '2025-10-25 06:39:43.042', true);
INSERT INTO public.payroll_payments VALUES ('65c48ab5-ac60-4140-b4e0-180f3d9409fa', 'f2e1823e-019c-49a2-9a65-916dcb7fe25d', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 6760.00, 1022.25, 5737.75, '', '2025-10-24 19:38:51.764534', '2025-10-25 06:39:43.459', true);
INSERT INTO public.payroll_payments VALUES ('082e9d81-5db7-493e-8134-dd26a12536a9', 'bc051b8a-51b2-4b71-a148-6f6b59ec4d1c', '2025-10-24', '2025-10-01', '2025-10-31', 10, 2025, 11072.00, 1570.20, 9501.80, NULL, '2025-10-24 19:38:36.021198', '2025-10-25 06:49:46.113', true);


--
-- Data for Name: deductions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.deductions VALUES ('7b868f61-2d92-4fa8-a9de-6036f8ae758c', 'ca1d48ac-09fb-4af6-a8a2-3a34f0403a21', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 210.00, 11.13, true, '2025-10-23 07:23:09.573511');
INSERT INTO public.deductions VALUES ('2f1a1e32-49d4-42bd-a144-66e9102b54a6', 'ca1d48ac-09fb-4af6-a8a2-3a34f0403a21', 'ALV', 'ALV Abzug', 1.1000, 210.00, 2.31, true, '2025-10-23 07:23:09.573511');
INSERT INTO public.deductions VALUES ('89ff31d1-712f-4442-ad45-ee9b36a307a9', 'ca1d48ac-09fb-4af6-a8a2-3a34f0403a21', 'NBU', 'NBU/SUVA Abzug', 1.1680, 210.00, 2.45, true, '2025-10-23 07:23:09.573511');
INSERT INTO public.deductions VALUES ('e83b3975-2034-4031-8359-c8b57b1ebf72', 'ca1d48ac-09fb-4af6-a8a2-3a34f0403a21', 'BVG', 'Pensionskasse', NULL, NULL, 0.00, false, '2025-10-23 07:23:09.573511');
INSERT INTO public.deductions VALUES ('c1d46127-b44a-404d-88ce-26fb88156274', '58d7548f-6730-48b9-b838-609ebebca0d0', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7300.00, 386.90, true, '2025-10-23 07:30:42.624766');
INSERT INTO public.deductions VALUES ('323e46e9-3253-4a45-b47e-2d6c0fcf50f7', '58d7548f-6730-48b9-b838-609ebebca0d0', 'ALV', 'ALV Abzug', 1.1000, 7300.00, 80.30, true, '2025-10-23 07:30:42.624766');
INSERT INTO public.deductions VALUES ('c20253a0-4891-4147-b054-00bf269d28a6', '58d7548f-6730-48b9-b838-609ebebca0d0', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7300.00, 85.26, true, '2025-10-23 07:30:42.624766');
INSERT INTO public.deductions VALUES ('d897b1c8-866f-4d7b-b886-66f642e24a41', '58d7548f-6730-48b9-b838-609ebebca0d0', 'BVG', 'Pensionskasse', NULL, NULL, 518.75, false, '2025-10-23 07:30:42.624766');
INSERT INTO public.deductions VALUES ('dfbfd3c2-2864-49e4-9677-0cd6acc3e8f2', '4291b0e6-0f92-4ef7-9501-4e23d125bed8', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 350.00, 18.55, true, '2025-10-24 09:22:19.272688');
INSERT INTO public.deductions VALUES ('480f4115-1ff8-4a5f-8ec8-ad421f9a73f8', '4291b0e6-0f92-4ef7-9501-4e23d125bed8', 'ALV', 'ALV Abzug', 1.1000, 350.00, 3.85, true, '2025-10-24 09:22:19.272688');
INSERT INTO public.deductions VALUES ('adefbb1e-cd3d-4d22-bd61-46e9e4a32ff4', '12739a89-a58e-4b8d-ad56-88c16aa418b7', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7600.00, 402.80, true, '2025-10-23 18:55:20.066577');
INSERT INTO public.deductions VALUES ('2387343f-a9a6-4bfe-a471-af4d8d939b54', '12739a89-a58e-4b8d-ad56-88c16aa418b7', 'ALV', 'ALV Abzug', 1.1000, 7600.00, 83.60, true, '2025-10-23 18:55:20.066577');
INSERT INTO public.deductions VALUES ('59f019a8-31fd-43db-82b2-d9da423abbe9', '54080893-ad3f-4958-b6cb-2bcefadbbf37', 'ALV', 'ALV Abzug', 1.1000, 8400.00, 92.40, true, '2025-10-25 06:22:42.792803');
INSERT INTO public.deductions VALUES ('f676560b-2ca5-4b84-b2c0-ae9b90429e47', '54080893-ad3f-4958-b6cb-2bcefadbbf37', 'NBU', 'NBU/SUVA Abzug', 1.1680, 8400.00, 98.11, true, '2025-10-25 06:22:42.792803');
INSERT INTO public.deductions VALUES ('ed9a260f-dd58-4b30-9e9e-61a2f1dfc8af', '54080893-ad3f-4958-b6cb-2bcefadbbf37', 'BVG', 'BVG Abzug', NULL, 8400.00, 434.70, true, '2025-10-25 06:22:42.792803');
INSERT INTO public.deductions VALUES ('7390da63-363b-4066-8a64-e9916531f845', '1c1386f3-39f0-4217-bc5a-b81e7e93d170', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6100.00, 323.30, true, '2025-10-25 06:28:41.412497');
INSERT INTO public.deductions VALUES ('319f7f02-4d51-402a-9d7d-8320667bb613', '1c1386f3-39f0-4217-bc5a-b81e7e93d170', 'ALV', 'ALV Abzug', 1.1000, 6100.00, 67.10, true, '2025-10-25 06:28:41.412497');
INSERT INTO public.deductions VALUES ('0228396d-7496-49d9-82e9-d52bfca672cd', '1c1386f3-39f0-4217-bc5a-b81e7e93d170', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6100.00, 71.25, true, '2025-10-25 06:28:41.412497');
INSERT INTO public.deductions VALUES ('f9315bf9-d79c-45f3-87bb-085e07b918b7', '1c1386f3-39f0-4217-bc5a-b81e7e93d170', 'BVG', 'BVG Abzug', NULL, 6100.00, 407.05, true, '2025-10-25 06:28:41.412497');
INSERT INTO public.deductions VALUES ('08026780-18eb-489d-85af-3df6d115b06e', '64fb118b-22bb-4372-9e9f-20eb662b4529', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 12100.00, 641.30, true, '2025-10-25 06:35:21.253394');
INSERT INTO public.deductions VALUES ('a5883c50-04d4-4080-a64f-cf66324ad3db', '4291b0e6-0f92-4ef7-9501-4e23d125bed8', 'NBU', 'NBU/SUVA Abzug', 1.1680, 350.00, 4.09, true, '2025-10-24 09:22:19.272688');
INSERT INTO public.deductions VALUES ('d6cf483f-a067-4028-bad7-9c69259bc1f6', 'e7354a6f-b518-460c-9d86-b5cd97247c6a', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 392.00, 20.78, true, '2025-10-24 09:25:50.411542');
INSERT INTO public.deductions VALUES ('96b5a7d3-ad9d-4546-a825-2f1afda5804c', 'e7354a6f-b518-460c-9d86-b5cd97247c6a', 'ALV', 'ALV Abzug', 1.1000, 392.00, 4.31, true, '2025-10-24 09:25:50.411542');
INSERT INTO public.deductions VALUES ('b539b7e3-9bb2-4fc5-8e22-62f45945f693', '64fb118b-22bb-4372-9e9f-20eb662b4529', 'ALV', 'ALV Abzug', 1.1000, 12350.00, 135.85, true, '2025-10-25 06:35:21.253394');
INSERT INTO public.deductions VALUES ('22dda1f3-794e-43d1-9bd4-4a59104b1e9d', '64fb118b-22bb-4372-9e9f-20eb662b4529', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12350.00, 144.25, true, '2025-10-25 06:35:21.253394');
INSERT INTO public.deductions VALUES ('0a00d758-3b07-4238-859e-0812d23a52d1', '64fb118b-22bb-4372-9e9f-20eb662b4529', 'BVG', 'BVG Abzug', NULL, 12100.00, 823.05, true, '2025-10-25 06:35:21.253394');
INSERT INTO public.deductions VALUES ('c0c2816d-22c9-4ffb-9879-ca1c1010c737', '082e9d81-5db7-493e-8134-dd26a12536a9', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 10000.00, 530.00, true, '2025-10-25 06:49:36.360229');
INSERT INTO public.deductions VALUES ('2cc6097b-7807-4e23-92bf-ecfe2e6c0424', '082e9d81-5db7-493e-8134-dd26a12536a9', 'ALV', 'ALV Abzug', 1.1000, 10000.00, 110.00, true, '2025-10-25 06:49:36.360229');
INSERT INTO public.deductions VALUES ('c639fe16-9826-47da-9674-efb055a0d189', '082e9d81-5db7-493e-8134-dd26a12536a9', 'NBU', 'NBU/SUVA Abzug', 1.1680, 10000.00, 116.80, true, '2025-10-25 06:49:36.360229');
INSERT INTO public.deductions VALUES ('051629b8-165a-4741-be36-3bb977e98bd3', '082e9d81-5db7-493e-8134-dd26a12536a9', 'BVG', 'BVG Abzug', NULL, 10000.00, 813.40, true, '2025-10-25 06:49:36.360229');
INSERT INTO public.deductions VALUES ('0431bb29-2a4f-4a98-b246-6b1f959bd17d', '6925a954-b56c-4837-b99a-8edfd3548a51', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 400000.00, 21200.00, true, '2025-10-25 07:25:20.291651');
INSERT INTO public.deductions VALUES ('199607d3-9116-4c18-89a2-23d6ce5f93b2', '6925a954-b56c-4837-b99a-8edfd3548a51', 'ALV', 'ALV Abzug', 1.1000, 12350.00, 135.85, true, '2025-10-25 07:25:20.291651');
INSERT INTO public.deductions VALUES ('256ee302-6407-4958-8b0a-77d57ea35bc3', '12739a89-a58e-4b8d-ad56-88c16aa418b7', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7600.00, 88.77, true, '2025-10-23 18:55:20.066577');
INSERT INTO public.deductions VALUES ('1c3507dd-1a57-4697-855c-a6b0757d4088', '12739a89-a58e-4b8d-ad56-88c16aa418b7', 'BVG', 'Pensionskasse', NULL, NULL, 407.05, false, '2025-10-23 18:55:20.066577');
INSERT INTO public.deductions VALUES ('b45c83f4-3a6d-4383-af80-c7bca6b02c79', '696e7051-0499-4d62-a1ec-0e3a285afa78', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-23 18:56:24.50638');
INSERT INTO public.deductions VALUES ('d275abad-0828-47bc-a5fa-9a16520abfba', '696e7051-0499-4d62-a1ec-0e3a285afa78', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-23 18:56:24.50638');
INSERT INTO public.deductions VALUES ('9b9373f2-65cf-483b-b951-1dff3257f203', 'f023734e-8cdf-4e4f-9be2-a2bc69296dd7', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 10450.00, 553.85, true, '2025-10-23 18:59:55.386657');
INSERT INTO public.deductions VALUES ('a02d1bd9-1a7c-4a7c-95bc-e914800bb8ea', 'f023734e-8cdf-4e4f-9be2-a2bc69296dd7', 'ALV', 'ALV Abzug', 1.1000, 10450.00, 114.95, true, '2025-10-23 18:59:55.386657');
INSERT INTO public.deductions VALUES ('6b4d415b-d7ba-49ad-a4d2-16bf5f75e76b', '6925a954-b56c-4837-b99a-8edfd3548a51', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12350.00, 144.25, true, '2025-10-25 07:25:20.291651');
INSERT INTO public.deductions VALUES ('2381d500-9878-4133-bcda-98c034f184ed', '6925a954-b56c-4837-b99a-8edfd3548a51', 'BVG', 'BVG Abzug', NULL, 400000.00, 823.05, true, '2025-10-25 07:25:20.291651');
INSERT INTO public.deductions VALUES ('af2a0ce7-34d4-4a9b-baaa-3bd124fb2200', '27695b25-e40b-4bf2-9d04-7f562f3e1359', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7150.00, 378.95, true, '2025-10-26 12:10:44.771914');
INSERT INTO public.deductions VALUES ('e3087b5d-69c7-401d-ad7f-d36d66f3834a', '27695b25-e40b-4bf2-9d04-7f562f3e1359', 'ALV', 'ALV Abzug', 1.1000, 7150.00, 78.65, true, '2025-10-26 12:10:44.771914');
INSERT INTO public.deductions VALUES ('c9ce8e52-64e8-4230-b48b-a8c9388d64b6', '27695b25-e40b-4bf2-9d04-7f562f3e1359', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7150.00, 83.51, true, '2025-10-26 12:10:44.771914');
INSERT INTO public.deductions VALUES ('962b106a-c1e8-4795-9bbb-012a750f6d62', '27695b25-e40b-4bf2-9d04-7f562f3e1359', 'BVG', 'BVG Abzug', NULL, 7150.00, 581.75, true, '2025-10-26 12:10:44.771914');
INSERT INTO public.deductions VALUES ('c3f954b0-bbb5-4f09-bfb0-5cac3d6b0c75', 'f2778d65-f60a-4c7f-bcbc-bf2343c6caf0', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6668.00, 353.40, true, '2025-10-23 07:24:58.845635');
INSERT INTO public.deductions VALUES ('f527a60a-bf7f-4d60-8673-49f3497b05a9', 'f2778d65-f60a-4c7f-bcbc-bf2343c6caf0', 'ALV', 'ALV Abzug', 1.1000, 6668.00, 73.35, true, '2025-10-23 07:24:58.845635');
INSERT INTO public.deductions VALUES ('8f894152-0b6d-41c4-a441-fda40dc6d59f', 'f2778d65-f60a-4c7f-bcbc-bf2343c6caf0', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6668.00, 77.88, true, '2025-10-23 07:24:58.845635');
INSERT INTO public.deductions VALUES ('072c867e-08a4-491a-8fa2-d7ea78ebc672', 'f2778d65-f60a-4c7f-bcbc-bf2343c6caf0', 'BVG', 'Pensionskasse', NULL, NULL, 510.10, false, '2025-10-23 07:24:58.845635');
INSERT INTO public.deductions VALUES ('f3c76c0d-0d03-48f5-9e1a-5e27a97261b8', 'e7354a6f-b518-460c-9d86-b5cd97247c6a', 'NBU', 'NBU/SUVA Abzug', 1.1680, 392.00, 4.58, true, '2025-10-24 09:25:50.411542');
INSERT INTO public.deductions VALUES ('e7b2c143-466d-43b2-881d-8b485fbc1917', 'f4df5e5a-cde7-4c58-adc1-9d21e30afcb4', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 280.00, 14.84, true, '2025-10-24 13:56:19.192857');
INSERT INTO public.deductions VALUES ('16ef4110-41f2-4173-9497-7d77d32238cc', 'bb108261-5be2-4c43-9fd5-09924c68af69', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 12100.00, 641.30, true, '2025-10-24 21:21:01.942467');
INSERT INTO public.deductions VALUES ('d27dd761-932c-4bec-a6e3-246414500ca1', 'bb108261-5be2-4c43-9fd5-09924c68af69', 'ALV', 'ALV Abzug', 1.1000, 12350.00, 135.85, true, '2025-10-24 21:21:01.942467');
INSERT INTO public.deductions VALUES ('2e159044-2e19-4357-88ae-806c40ed7ee9', 'bb108261-5be2-4c43-9fd5-09924c68af69', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12350.00, 144.25, true, '2025-10-24 21:21:01.942467');
INSERT INTO public.deductions VALUES ('934267e5-fa81-43eb-a3ea-a9428dbc0aa4', 'bb108261-5be2-4c43-9fd5-09924c68af69', 'BVG', 'BVG Abzug', NULL, 12100.00, 823.05, true, '2025-10-24 21:21:01.942467');
INSERT INTO public.deductions VALUES ('6928f972-7acd-4241-afc1-89254ceaf349', 'f4df5e5a-cde7-4c58-adc1-9d21e30afcb4', 'ALV', 'ALV Abzug', 1.1000, 280.00, 3.08, true, '2025-10-24 13:56:19.192857');
INSERT INTO public.deductions VALUES ('2b2162f8-1d23-45be-913e-49fd471d19e9', 'f4df5e5a-cde7-4c58-adc1-9d21e30afcb4', 'NBU', 'NBU/SUVA Abzug', 1.1680, 280.00, 3.27, true, '2025-10-24 13:56:19.192857');
INSERT INTO public.deductions VALUES ('526a1182-650a-48a3-a8bc-7462d48827da', '41c6c9c6-cb6c-4072-a3a4-3ca4c3d056f4', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7385.00, 391.40, true, '2025-10-23 07:31:00.233161');
INSERT INTO public.deductions VALUES ('25905659-a20a-4978-8c26-f5f1c15b6aed', '41c6c9c6-cb6c-4072-a3a4-3ca4c3d056f4', 'ALV', 'ALV Abzug', 1.1000, 7385.00, 81.24, true, '2025-10-23 07:31:00.233161');
INSERT INTO public.deductions VALUES ('4799de20-b800-4793-ab4e-9bf719e5a62f', '41c6c9c6-cb6c-4072-a3a4-3ca4c3d056f4', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7385.00, 86.26, true, '2025-10-23 07:31:00.233161');
INSERT INTO public.deductions VALUES ('e0427a0a-d412-4eac-80ea-cb50ed6091b8', '41c6c9c6-cb6c-4072-a3a4-3ca4c3d056f4', 'BVG', 'Pensionskasse', NULL, NULL, 307.65, false, '2025-10-23 07:31:00.233161');
INSERT INTO public.deductions VALUES ('9d4b02a2-4064-4711-a87b-2254eee4f826', 'f0d2289b-e3e4-4e46-8202-30bb43d3faec', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-23 07:58:30.520769');
INSERT INTO public.deductions VALUES ('efc81f41-c668-433a-9d43-8297c8c47d79', 'f0d2289b-e3e4-4e46-8202-30bb43d3faec', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-23 07:58:30.520769');
INSERT INTO public.deductions VALUES ('276cd457-2d3f-4971-838a-b9c33eaedf59', '6facba06-e49d-470a-a3db-38385853de66', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 5000.00, 265.00, true, '2025-10-21 20:21:36.303673');
INSERT INTO public.deductions VALUES ('3d0b8419-297a-40fe-ba12-89f50095dc3e', '6facba06-e49d-470a-a3db-38385853de66', 'ALV', 'ALV Abzug', 1.1000, 5000.00, 55.00, true, '2025-10-21 20:21:36.303673');
INSERT INTO public.deductions VALUES ('789ba692-0d80-47e8-a7be-806b78373e3b', '6facba06-e49d-470a-a3db-38385853de66', 'NBU', 'NBU/SUVA Abzug', 1.1680, 5000.00, 58.40, true, '2025-10-21 20:21:36.303673');
INSERT INTO public.deductions VALUES ('c6fdad0a-defa-456b-9680-08526c4f887a', '6facba06-e49d-470a-a3db-38385853de66', 'BVG', 'Pensionskasse', NULL, NULL, 175.00, false, '2025-10-21 20:21:36.303673');
INSERT INTO public.deductions VALUES ('ed3bbbb1-8a40-4797-ab9a-41b0659fdc3a', '29bc390b-a16b-472e-b9c5-74ed994306fe', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 105.00, 5.56, true, '2025-10-25 06:24:24.086199');
INSERT INTO public.deductions VALUES ('893b45f2-2016-4b21-8432-091a17f2e778', '29bc390b-a16b-472e-b9c5-74ed994306fe', 'ALV', 'ALV Abzug', 1.1000, 105.00, 1.16, true, '2025-10-25 06:24:24.086199');
INSERT INTO public.deductions VALUES ('2fda21c2-2c49-4bbd-afee-894d5831e6f3', '29bc390b-a16b-472e-b9c5-74ed994306fe', 'NBU', 'NBU/SUVA Abzug', 1.1680, 105.00, 1.23, true, '2025-10-25 06:24:24.086199');
INSERT INTO public.deductions VALUES ('c3b9176b-f428-4928-8be8-c7fab00cc1ca', 'd5b0f70a-321d-4917-811f-e1d172c74201', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 392.00, 20.78, true, '2025-10-25 06:29:40.861693');
INSERT INTO public.deductions VALUES ('b8b8001c-d681-452f-8403-ececd54e9593', '14a2fb00-adc3-45d4-ade7-2c4e75841564', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 5950.00, 315.35, true, '2025-10-22 09:17:14.385205');
INSERT INTO public.deductions VALUES ('0238b9f8-b4d5-476b-b7a9-b513ca2e4d76', '14a2fb00-adc3-45d4-ade7-2c4e75841564', 'ALV', 'ALV Abzug', 1.1000, 5950.00, 65.45, true, '2025-10-22 09:17:14.385205');
INSERT INTO public.deductions VALUES ('0cf3d81f-63a4-4bf3-9ff5-33aba1a49766', '14a2fb00-adc3-45d4-ade7-2c4e75841564', 'NBU', 'NBU/SUVA Abzug', 1.1680, 5950.00, 69.50, true, '2025-10-22 09:17:14.385205');
INSERT INTO public.deductions VALUES ('23edf7a3-b0bb-4edf-a73d-0757fcab5674', '14a2fb00-adc3-45d4-ade7-2c4e75841564', 'BVG', 'Pensionskasse', NULL, NULL, 208.25, false, '2025-10-22 09:17:14.385205');
INSERT INTO public.deductions VALUES ('3d4e54b4-5f13-4a90-a3fe-5a02b956a050', 'd5b0f70a-321d-4917-811f-e1d172c74201', 'ALV', 'ALV Abzug', 1.1000, 392.00, 4.31, true, '2025-10-25 06:29:40.861693');
INSERT INTO public.deductions VALUES ('d63b2cf8-063d-4c3f-a8ea-e23a1c23443a', 'd5b0f70a-321d-4917-811f-e1d172c74201', 'NBU', 'NBU/SUVA Abzug', 1.1680, 392.00, 4.58, true, '2025-10-25 06:29:40.861693');
INSERT INTO public.deductions VALUES ('ebec4956-5a6d-4f97-b167-22cd3577ced0', '8f84c35f-f77d-418a-92b9-cc1e3cfb2519', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6668.00, 353.40, true, '2025-10-22 19:22:01.056233');
INSERT INTO public.deductions VALUES ('f944555a-8bac-4eda-b97b-5a681a8119fd', '8f84c35f-f77d-418a-92b9-cc1e3cfb2519', 'ALV', 'ALV Abzug', 1.1000, 6668.00, 73.35, true, '2025-10-22 19:22:01.056233');
INSERT INTO public.deductions VALUES ('ca8d27d7-19fd-4a16-8a12-c7b61fb25d55', '8f84c35f-f77d-418a-92b9-cc1e3cfb2519', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6668.00, 77.88, true, '2025-10-22 19:22:01.056233');
INSERT INTO public.deductions VALUES ('a28eb31f-07e3-4e52-b834-34565ceb2f67', 'a27f83e7-f85c-4f19-8af0-de82e7603ffe', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 166.60, 8.83, true, '2025-10-26 21:27:23.139954');
INSERT INTO public.deductions VALUES ('ac9542e3-8ca0-4af8-b795-b8b1e637b9f2', 'a27f83e7-f85c-4f19-8af0-de82e7603ffe', 'ALV', 'ALV Abzug', 1.1000, 166.60, 1.83, true, '2025-10-26 21:27:23.139954');
INSERT INTO public.deductions VALUES ('1a585a11-3ff8-45b8-82a8-d2e318d0674e', 'a27f83e7-f85c-4f19-8af0-de82e7603ffe', 'NBU', 'NBU/SUVA Abzug', 1.1680, 166.60, 1.95, true, '2025-10-26 21:27:23.139954');
INSERT INTO public.deductions VALUES ('fd5cfcc6-c42d-43a7-95f4-09de472194c7', 'a27f83e7-f85c-4f19-8af0-de82e7603ffe', 'BVG', 'BVG Abzug', 5.8800, 166.60, 9.80, true, '2025-10-26 21:27:23.139954');
INSERT INTO public.deductions VALUES ('61c94740-2fd6-4885-ba22-364d18349b2f', 'a27f83e7-f85c-4f19-8af0-de82e7603ffe', 'KTG GAV', 'KTG GAV Personalverleih', 1.5150, 166.60, 2.52, true, '2025-10-26 21:27:23.139954');
INSERT INTO public.deductions VALUES ('21caac4a-061b-4405-ad1d-df80707aa99a', 'a27f83e7-f85c-4f19-8af0-de82e7603ffe', 'Berufsbeitrag GAV', 'Berufsbeitrag GAV Personalverleih', 0.4000, 166.60, 0.67, true, '2025-10-26 21:27:23.139954');
INSERT INTO public.deductions VALUES ('637a9de2-22ab-4b2e-a83a-541f6c8c1f40', '8f84c35f-f77d-418a-92b9-cc1e3cfb2519', 'BVG', 'Pensionskasse', NULL, NULL, 510.10, false, '2025-10-22 19:22:01.056233');
INSERT INTO public.deductions VALUES ('ec1974d3-e6ea-4048-9e8b-3cce5b2a6fe8', '3f4b2234-a67a-4bc1-8d79-5207c9980d69', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 5961.00, 315.93, true, '2025-10-23 07:25:12.689133');
INSERT INTO public.deductions VALUES ('1e237eb4-cf23-460b-818e-e156c92f2f18', '3f4b2234-a67a-4bc1-8d79-5207c9980d69', 'ALV', 'ALV Abzug', 1.1000, 5961.00, 65.57, true, '2025-10-23 07:25:12.689133');
INSERT INTO public.deductions VALUES ('620d6ca3-e7de-4f4c-83c8-36774325b61d', '3f4b2234-a67a-4bc1-8d79-5207c9980d69', 'NBU', 'NBU/SUVA Abzug', 1.1680, 5961.00, 69.62, true, '2025-10-23 07:25:12.689133');
INSERT INTO public.deductions VALUES ('4f9b426a-6dc3-4144-a1ec-dc73468c1bf0', '3f4b2234-a67a-4bc1-8d79-5207c9980d69', 'BVG', 'Pensionskasse', NULL, NULL, 294.00, false, '2025-10-23 07:25:12.689133');
INSERT INTO public.deductions VALUES ('c7d812a9-9d14-4caa-9957-56f598b2f018', '7410c8f2-47ba-4333-8eb1-e88db52723c8', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-23 07:29:40.790514');
INSERT INTO public.deductions VALUES ('24ceeef3-d29b-483b-aa97-11087c27c2d9', '7410c8f2-47ba-4333-8eb1-e88db52723c8', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-23 07:29:40.790514');
INSERT INTO public.deductions VALUES ('e34fda65-4d42-4fd3-8afa-8dca1c01f9e1', 'eaabc451-ea95-4b28-be40-d823e40c9f62', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7385.00, 391.40, true, '2025-10-25 06:21:33.30665');
INSERT INTO public.deductions VALUES ('e8af3c81-04a2-4ea8-b5eb-c4014475a5df', 'eaabc451-ea95-4b28-be40-d823e40c9f62', 'ALV', 'ALV Abzug', 1.1000, 7385.00, 81.24, true, '2025-10-25 06:21:33.30665');
INSERT INTO public.deductions VALUES ('7207b61a-dee0-46b4-9a79-a1f4ca748c6a', 'eaabc451-ea95-4b28-be40-d823e40c9f62', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7385.00, 86.26, true, '2025-10-25 06:21:33.30665');
INSERT INTO public.deductions VALUES ('7de550ad-61b9-4d27-9781-76402d075b14', 'eaabc451-ea95-4b28-be40-d823e40c9f62', 'BVG', 'BVG Abzug', NULL, 7385.00, 388.70, true, '2025-10-25 06:21:33.30665');
INSERT INTO public.deductions VALUES ('4a47778a-5a7b-4ae9-8584-c1c303c1eecf', '33b3ec03-d668-43a3-9494-5cc5a9e843c5', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 105.00, 5.56, true, '2025-10-25 06:24:57.025204');
INSERT INTO public.deductions VALUES ('13f56dc5-f9d5-48c6-8e74-23a1a8513589', '33b3ec03-d668-43a3-9494-5cc5a9e843c5', 'ALV', 'ALV Abzug', 1.1000, 105.00, 1.16, true, '2025-10-25 06:24:57.025204');
INSERT INTO public.deductions VALUES ('d775513e-808a-4d5e-9aea-cc99edd41cdb', '33b3ec03-d668-43a3-9494-5cc5a9e843c5', 'NBU', 'NBU/SUVA Abzug', 1.1680, 105.00, 1.23, true, '2025-10-25 06:24:57.025204');
INSERT INTO public.deductions VALUES ('63657179-1c97-4320-9ca5-a1e72e25186f', '2b43321d-6233-416a-8f5a-d71f1e12635e', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 320.00, 16.96, true, '2025-10-25 06:30:48.794055');
INSERT INTO public.deductions VALUES ('c6f4f9ad-66d5-4c1c-a048-8528be750377', '7410c8f2-47ba-4333-8eb1-e88db52723c8', 'BVG', 'Pensionskasse', NULL, NULL, 0.00, false, '2025-10-23 07:29:40.790514');
INSERT INTO public.deductions VALUES ('02b59478-df01-48ff-bb06-dc2e136f180e', '3e861e79-ec2b-4452-b087-2f1626600930', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 8300.00, 439.90, true, '2025-10-23 07:59:33.405083');
INSERT INTO public.deductions VALUES ('b395a9e3-d66c-4372-aceb-198aa6f136f5', '3e861e79-ec2b-4452-b087-2f1626600930', 'ALV', 'ALV Abzug', 1.1000, 8300.00, 91.30, true, '2025-10-23 07:59:33.405083');
INSERT INTO public.deductions VALUES ('1bd13c17-8e7d-4845-ae7a-ab3eba68c330', '3e861e79-ec2b-4452-b087-2f1626600930', 'NBU', 'NBU/SUVA Abzug', 1.1680, 8300.00, 96.94, true, '2025-10-23 07:59:33.405083');
INSERT INTO public.deductions VALUES ('a4719049-12c4-48c0-8774-507b85e9411a', '0a33fe8a-c6fa-4f3d-ba30-f3bd5a0cc7f9', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 5961.00, 315.93, true, '2025-10-23 06:20:20.729177');
INSERT INTO public.deductions VALUES ('63a0c260-f0fa-4b49-bd38-06c0901070bb', '0a33fe8a-c6fa-4f3d-ba30-f3bd5a0cc7f9', 'ALV', 'ALV Abzug', 1.1000, 5961.00, 65.57, true, '2025-10-23 06:20:20.729177');
INSERT INTO public.deductions VALUES ('0f3c4f19-195c-4204-aa54-f6a9ff2731a2', '0a33fe8a-c6fa-4f3d-ba30-f3bd5a0cc7f9', 'NBU', 'NBU/SUVA Abzug', 1.1680, 5961.00, 69.62, true, '2025-10-23 06:20:20.729177');
INSERT INTO public.deductions VALUES ('9cceaffa-9715-448c-9a70-2dd949da3c29', '0a33fe8a-c6fa-4f3d-ba30-f3bd5a0cc7f9', 'BVG', 'Pensionskasse', NULL, NULL, 294.00, false, '2025-10-23 06:20:20.729177');
INSERT INTO public.deductions VALUES ('9fd80e76-4b05-4feb-8cf2-daf46e048854', '3e861e79-ec2b-4452-b087-2f1626600930', 'BVG', 'Pensionskasse', NULL, NULL, 434.10, false, '2025-10-23 07:59:33.405083');
INSERT INTO public.deductions VALUES ('e1ce082e-e12d-4844-a862-3c7b34bc76ea', '8178b4a4-0549-4889-9fea-c9d5a81fc674', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 350.00, 18.55, true, '2025-10-23 18:10:42.286048');
INSERT INTO public.deductions VALUES ('e985e140-2c8f-4898-a32b-33fb081f1540', '8178b4a4-0549-4889-9fea-c9d5a81fc674', 'ALV', 'ALV Abzug', 1.1000, 350.00, 3.85, true, '2025-10-23 18:10:42.286048');
INSERT INTO public.deductions VALUES ('a4db0a11-4b5b-46ab-bffe-1a1b4e7b0509', '8178b4a4-0549-4889-9fea-c9d5a81fc674', 'NBU', 'NBU/SUVA Abzug', 1.1680, 350.00, 4.09, true, '2025-10-23 18:10:42.286048');
INSERT INTO public.deductions VALUES ('288bb949-6b3b-4d69-9267-791292c4f8bd', 'c029a1b9-4167-403a-90c7-104fe0b0917f', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 340.00, 18.02, true, '2025-10-23 18:55:59.868255');
INSERT INTO public.deductions VALUES ('0d99fda7-a690-41a0-a3f2-46515696c3f0', 'c029a1b9-4167-403a-90c7-104fe0b0917f', 'ALV', 'ALV Abzug', 1.1000, 340.00, 3.74, true, '2025-10-23 18:55:59.868255');
INSERT INTO public.deductions VALUES ('83be0075-7764-4c0c-857f-069b231f324e', '10850448-1f21-4c15-b950-2316c7a21661', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 583.20, 30.91, true, '2025-10-23 06:25:56.854714');
INSERT INTO public.deductions VALUES ('8ea38cb6-7c8f-4ecd-a194-bdc234944261', '10850448-1f21-4c15-b950-2316c7a21661', 'ALV', 'ALV Abzug', 1.1000, 583.20, 6.42, true, '2025-10-23 06:25:56.854714');
INSERT INTO public.deductions VALUES ('a71865e9-bb90-4cdd-9c58-4b71754228e0', '10850448-1f21-4c15-b950-2316c7a21661', 'NBU', 'NBU/SUVA Abzug', 1.1680, 583.20, 6.81, true, '2025-10-23 06:25:56.854714');
INSERT INTO public.deductions VALUES ('7b35c8dd-d070-4394-90b3-49e91404e2de', '10850448-1f21-4c15-b950-2316c7a21661', 'BVG', 'Pensionskasse', NULL, NULL, 0.00, false, '2025-10-23 06:25:56.854714');
INSERT INTO public.deductions VALUES ('60c0c72a-fd48-464b-a28d-c1cc023c0bf0', '604cf41d-61ac-439e-a3b5-70d263102de2', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 12100.00, 641.30, true, '2025-10-23 06:27:44.634793');
INSERT INTO public.deductions VALUES ('c37873f3-192b-4a97-9977-95c8e920f70a', '604cf41d-61ac-439e-a3b5-70d263102de2', 'ALV', 'ALV Abzug', 1.1000, 12100.00, 133.10, true, '2025-10-23 06:27:44.634793');
INSERT INTO public.deductions VALUES ('1d0d3397-6e66-4604-8b05-b6be3c33be95', '604cf41d-61ac-439e-a3b5-70d263102de2', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12100.00, 141.33, true, '2025-10-23 06:27:44.634793');
INSERT INTO public.deductions VALUES ('1abcdb4a-6589-463b-aefc-fc3a029d1d19', '604cf41d-61ac-439e-a3b5-70d263102de2', 'BVG', 'Pensionskasse', NULL, NULL, 808.55, false, '2025-10-23 06:27:44.634793');
INSERT INTO public.deductions VALUES ('2aed2e19-8c5d-44bb-820c-bbe88cfcd5ba', '158d139a-79c3-49d0-a06e-f1baf73d85c3', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7300.00, 386.90, true, '2025-10-23 06:28:59.994379');
INSERT INTO public.deductions VALUES ('2a6a484b-6a13-4a6c-b767-1d06ff9ac36c', '158d139a-79c3-49d0-a06e-f1baf73d85c3', 'ALV', 'ALV Abzug', 1.1000, 7300.00, 80.30, true, '2025-10-23 06:28:59.994379');
INSERT INTO public.deductions VALUES ('1690ba59-866a-4d8d-b24c-a30eb14bd468', '158d139a-79c3-49d0-a06e-f1baf73d85c3', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7300.00, 85.26, true, '2025-10-23 06:28:59.994379');
INSERT INTO public.deductions VALUES ('49dbab76-642c-485c-949a-e3ee00019971', '158d139a-79c3-49d0-a06e-f1baf73d85c3', 'BVG', 'Pensionskasse', NULL, NULL, 518.75, false, '2025-10-23 06:28:59.994379');
INSERT INTO public.deductions VALUES ('34c1bbb4-15bd-4a13-9265-7c7d275568f4', '80a67758-08f6-48de-96ac-03ba6ec3de75', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7385.00, 391.40, true, '2025-10-23 06:30:42.021912');
INSERT INTO public.deductions VALUES ('bfe53b6a-1e71-4db4-8cb3-6e3d51dab8ed', '80a67758-08f6-48de-96ac-03ba6ec3de75', 'ALV', 'ALV Abzug', 1.1000, 7385.00, 81.24, true, '2025-10-23 06:30:42.021912');
INSERT INTO public.deductions VALUES ('5215b92a-44eb-40c1-84a0-a1dc9d01f00f', '80a67758-08f6-48de-96ac-03ba6ec3de75', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7385.00, 86.26, true, '2025-10-23 06:30:42.021912');
INSERT INTO public.deductions VALUES ('4f021aee-9fc8-44a3-83ab-7493a3890d93', '80a67758-08f6-48de-96ac-03ba6ec3de75', 'BVG', 'Pensionskasse', NULL, NULL, 307.65, false, '2025-10-23 06:30:42.021912');
INSERT INTO public.deductions VALUES ('ef2a4a25-8f53-4f9b-a27f-0e3417d3dd47', '2acf929b-f040-45f1-aeba-d1260b57cdc7', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 8300.00, 439.90, true, '2025-10-23 06:32:48.945885');
INSERT INTO public.deductions VALUES ('8cdee8c7-0f94-4b6b-9fb1-58f87db852bf', '2acf929b-f040-45f1-aeba-d1260b57cdc7', 'ALV', 'ALV Abzug', 1.1000, 8300.00, 91.30, true, '2025-10-23 06:32:48.945885');
INSERT INTO public.deductions VALUES ('4231f4af-c473-4674-ae34-f9f9c7aebde5', '2acf929b-f040-45f1-aeba-d1260b57cdc7', 'NBU', 'NBU/SUVA Abzug', 1.1680, 8300.00, 96.94, true, '2025-10-23 06:32:48.945885');
INSERT INTO public.deductions VALUES ('2398774c-c85a-4b90-a03a-264181c778b1', '2acf929b-f040-45f1-aeba-d1260b57cdc7', 'BVG', 'Pensionskasse', NULL, NULL, 434.10, false, '2025-10-23 06:32:48.945885');
INSERT INTO public.deductions VALUES ('cfea5bf7-8e80-4a8e-935d-0578bb02d8c7', 'e374f8ab-3bcb-4675-916e-617dfd985dd9', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7150.00, 378.95, true, '2025-10-23 06:33:38.716742');
INSERT INTO public.deductions VALUES ('38f7ce91-a5fe-4828-b37d-90b3d5f6abf9', 'e374f8ab-3bcb-4675-916e-617dfd985dd9', 'ALV', 'ALV Abzug', 1.1000, 7150.00, 78.65, true, '2025-10-23 06:33:38.716742');
INSERT INTO public.deductions VALUES ('1cf6864a-caca-4279-b4ce-de39c22413b8', 'e374f8ab-3bcb-4675-916e-617dfd985dd9', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7150.00, 83.51, true, '2025-10-23 06:33:38.716742');
INSERT INTO public.deductions VALUES ('fd5ec093-af07-49c2-bc19-8cc26d6ca816', 'e374f8ab-3bcb-4675-916e-617dfd985dd9', 'BVG', 'Pensionskasse', NULL, NULL, 545.10, false, '2025-10-23 06:33:38.716742');
INSERT INTO public.deductions VALUES ('c8f3c243-6465-4303-a4f0-8423db4db595', 'f5f7e642-8f4f-4ed5-aaa4-3c1bcd3516d1', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 780.00, 41.34, true, '2025-10-23 07:25:31.299955');
INSERT INTO public.deductions VALUES ('33cad7ae-a82f-4059-87a1-39d46f7226d5', 'f5f7e642-8f4f-4ed5-aaa4-3c1bcd3516d1', 'ALV', 'ALV Abzug', 1.1000, 780.00, 8.58, true, '2025-10-23 07:25:31.299955');
INSERT INTO public.deductions VALUES ('abf653d1-b8f6-47ff-89a7-086a2bc88fe0', 'f5f7e642-8f4f-4ed5-aaa4-3c1bcd3516d1', 'NBU', 'NBU/SUVA Abzug', 1.1680, 780.00, 9.11, true, '2025-10-23 07:25:31.299955');
INSERT INTO public.deductions VALUES ('d55abc35-f184-4835-8d19-cef1564e35c4', 'f5f7e642-8f4f-4ed5-aaa4-3c1bcd3516d1', 'BVG', 'Pensionskasse', NULL, NULL, 0.00, false, '2025-10-23 07:25:31.299955');
INSERT INTO public.deductions VALUES ('f63a71e5-007d-4c13-b32a-236bb07eef2b', '1496d668-7134-48c6-974d-6f0259d6b296', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 12100.00, 641.30, true, '2025-10-23 07:30:28.974401');
INSERT INTO public.deductions VALUES ('6c104bf2-a9e6-4c4c-99a7-bce72113e322', '1496d668-7134-48c6-974d-6f0259d6b296', 'ALV', 'ALV Abzug', 1.1000, 12100.00, 133.10, true, '2025-10-23 07:30:28.974401');
INSERT INTO public.deductions VALUES ('11d3204b-161b-455f-b876-b03019b781c0', '1496d668-7134-48c6-974d-6f0259d6b296', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12100.00, 141.33, true, '2025-10-23 07:30:28.974401');
INSERT INTO public.deductions VALUES ('d373fc9b-4fe9-4057-9d44-7158748478e6', '1496d668-7134-48c6-974d-6f0259d6b296', 'BVG', 'Pensionskasse', NULL, NULL, 808.55, false, '2025-10-23 07:30:28.974401');
INSERT INTO public.deductions VALUES ('7414e472-f9b8-4ecb-ad58-f761ea983f4c', 'b2f98e90-2f6e-4814-8689-0a33b665cbcd', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7150.00, 378.95, true, '2025-10-23 07:59:47.467672');
INSERT INTO public.deductions VALUES ('c473645c-c61a-40e5-aff6-8b4f70b6a325', 'b2f98e90-2f6e-4814-8689-0a33b665cbcd', 'ALV', 'ALV Abzug', 1.1000, 7150.00, 78.65, true, '2025-10-23 07:59:47.467672');
INSERT INTO public.deductions VALUES ('383283c7-cae9-4a3c-bfcb-605307b557d4', 'b2f98e90-2f6e-4814-8689-0a33b665cbcd', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7150.00, 83.51, true, '2025-10-23 07:59:47.467672');
INSERT INTO public.deductions VALUES ('b795d652-53ff-45de-8006-b4346445af68', 'b2f98e90-2f6e-4814-8689-0a33b665cbcd', 'BVG', 'Pensionskasse', NULL, NULL, 545.10, false, '2025-10-23 07:59:47.467672');
INSERT INTO public.deductions VALUES ('82b39865-4f13-49e9-b84d-211da7393315', '530af5f6-0624-43b5-89e6-a244f6679347', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7450.00, 394.85, true, '2025-10-25 06:26:42.61363');
INSERT INTO public.deductions VALUES ('7e1a7736-7fca-44d3-9b81-d4747adf9b46', '530af5f6-0624-43b5-89e6-a244f6679347', 'ALV', 'ALV Abzug', 1.1000, 7450.00, 81.95, true, '2025-10-25 06:26:42.61363');
INSERT INTO public.deductions VALUES ('c6f429d5-3c87-4203-a662-3b3f682c58e9', '530af5f6-0624-43b5-89e6-a244f6679347', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7450.00, 87.02, true, '2025-10-25 06:26:42.61363');
INSERT INTO public.deductions VALUES ('b9e403ee-ba72-4635-9bf8-e685af2090c9', '530af5f6-0624-43b5-89e6-a244f6679347', 'BVG', 'BVG Abzug', NULL, 7450.00, 524.85, true, '2025-10-25 06:26:42.61363');
INSERT INTO public.deductions VALUES ('93bb2f93-5550-4a65-9731-3ead283b10cb', '2b43321d-6233-416a-8f5a-d71f1e12635e', 'ALV', 'ALV Abzug', 1.1000, 320.00, 3.52, true, '2025-10-25 06:30:48.794055');
INSERT INTO public.deductions VALUES ('5fb2e39e-8ee4-4c6a-acfa-d1f339c07ede', '2b43321d-6233-416a-8f5a-d71f1e12635e', 'NBU', 'NBU/SUVA Abzug', 1.1680, 320.00, 3.74, true, '2025-10-25 06:30:48.794055');
INSERT INTO public.deductions VALUES ('2eea5216-a9cf-4156-8533-01b5ebc6b7c7', '235cfd93-bfc6-4377-8de3-fbc840cdd1ea', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 8760.00, 464.28, true, '2025-10-23 18:55:00.927311');
INSERT INTO public.deductions VALUES ('78f26404-0915-4cd5-ac62-3845f3ba6f09', '235cfd93-bfc6-4377-8de3-fbc840cdd1ea', 'ALV', 'ALV Abzug', 1.1000, 8760.00, 96.36, true, '2025-10-23 18:55:00.927311');
INSERT INTO public.deductions VALUES ('97e399c9-71f7-4f40-9b81-be6f1c579528', '235cfd93-bfc6-4377-8de3-fbc840cdd1ea', 'NBU', 'NBU/SUVA Abzug', 1.1680, 8760.00, 102.32, true, '2025-10-23 18:55:00.927311');
INSERT INTO public.deductions VALUES ('5ab22ab5-ca38-4b29-9733-62266f610eaa', '235cfd93-bfc6-4377-8de3-fbc840cdd1ea', 'BVG', 'Pensionskasse', NULL, NULL, 510.65, false, '2025-10-23 18:55:00.927311');
INSERT INTO public.deductions VALUES ('7a4faf08-3b58-4f01-8095-31dc45f824f0', 'c029a1b9-4167-403a-90c7-104fe0b0917f', 'NBU', 'NBU/SUVA Abzug', 1.1680, 340.00, 3.97, true, '2025-10-23 18:55:59.868255');
INSERT INTO public.deductions VALUES ('c7fa5845-82d7-443a-a3c8-1951718f1561', '0018475c-fdfc-49c0-a84e-7856ee3a8c9e', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 30100.00, 1595.30, true, '2025-10-24 11:42:23.796399');
INSERT INTO public.deductions VALUES ('803fdaa3-77f0-4b40-8d31-f142f48a391f', '0018475c-fdfc-49c0-a84e-7856ee3a8c9e', 'ALV', 'ALV Abzug', 1.1000, 13100.00, 144.10, true, '2025-10-24 11:42:23.796399');
INSERT INTO public.deductions VALUES ('f8dfd144-b2b1-4990-8361-96950ddcb28e', 'f023734e-8cdf-4e4f-9be2-a2bc69296dd7', 'NBU', 'NBU/SUVA Abzug', 1.1680, 10450.00, 122.06, true, '2025-10-23 18:59:55.386657');
INSERT INTO public.deductions VALUES ('f00c5e35-1b0e-4534-ab9b-234a92377b46', 'f023734e-8cdf-4e4f-9be2-a2bc69296dd7', 'BVG', 'Pensionskasse', NULL, NULL, 524.85, false, '2025-10-23 18:59:55.386657');
INSERT INTO public.deductions VALUES ('0bbe1f08-29cb-4d75-b2c3-3cc1e0393119', 'b08b3556-85de-4469-b8ca-1fa2a0b4db66', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 8885.00, 470.90, true, '2025-10-23 19:00:27.050019');
INSERT INTO public.deductions VALUES ('60221a06-53bd-49a0-a831-81109e98196d', 'b08b3556-85de-4469-b8ca-1fa2a0b4db66', 'ALV', 'ALV Abzug', 1.1000, 8885.00, 97.74, true, '2025-10-23 19:00:27.050019');
INSERT INTO public.deductions VALUES ('8249d927-35f2-46f2-be06-b2208b8f5bda', 'b08b3556-85de-4469-b8ca-1fa2a0b4db66', 'NBU', 'NBU/SUVA Abzug', 1.1680, 8885.00, 103.78, true, '2025-10-23 19:00:27.050019');
INSERT INTO public.deductions VALUES ('fc9d91ff-e203-4658-b504-c57051511000', 'b08b3556-85de-4469-b8ca-1fa2a0b4db66', 'BVG', 'Pensionskasse', NULL, NULL, 388.70, false, '2025-10-23 19:00:27.050019');
INSERT INTO public.deductions VALUES ('fa676371-4066-489e-abdf-99ad91e3a059', 'c876c17a-cbce-42b4-984e-f156a7cf6a34', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 245.00, 12.98, true, '2025-10-23 19:00:49.657269');
INSERT INTO public.deductions VALUES ('bd9ff792-89a8-47f6-9cbf-17d1509e259e', 'c876c17a-cbce-42b4-984e-f156a7cf6a34', 'ALV', 'ALV Abzug', 1.1000, 245.00, 2.70, true, '2025-10-23 19:00:49.657269');
INSERT INTO public.deductions VALUES ('aba009a5-362d-4995-930b-3bfd28c14877', 'c876c17a-cbce-42b4-984e-f156a7cf6a34', 'NBU', 'NBU/SUVA Abzug', 1.1680, 245.00, 2.86, true, '2025-10-23 19:00:49.657269');
INSERT INTO public.deductions VALUES ('f80d15e1-eb62-4fea-ac33-87ff207f50ef', '2c1e2384-37d2-460d-9cfb-f53f3523a088', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 245.00, 12.98, true, '2025-10-23 19:00:59.734693');
INSERT INTO public.deductions VALUES ('b6173b7c-a577-409d-be0d-5f1cca88cef4', '2c1e2384-37d2-460d-9cfb-f53f3523a088', 'ALV', 'ALV Abzug', 1.1000, 245.00, 2.70, true, '2025-10-23 19:00:59.734693');
INSERT INTO public.deductions VALUES ('22666376-5071-4da1-96ac-00a0d3d8be72', '2c1e2384-37d2-460d-9cfb-f53f3523a088', 'NBU', 'NBU/SUVA Abzug', 1.1680, 245.00, 2.86, true, '2025-10-23 19:00:59.734693');
INSERT INTO public.deductions VALUES ('7d95175e-c72e-4cdd-92c6-d1c291d14dc2', '0018475c-fdfc-49c0-a84e-7856ee3a8c9e', 'NBU', 'NBU/SUVA Abzug', 1.1680, 13100.00, 153.01, true, '2025-10-24 11:42:23.796399');
INSERT INTO public.deductions VALUES ('882632db-0df6-4d1e-bf65-5a7b8937f2a1', '0018475c-fdfc-49c0-a84e-7856ee3a8c9e', 'BVG', 'BVG Abzug', NULL, 30100.00, 823.05, true, '2025-10-24 11:42:23.796399');
INSERT INTO public.deductions VALUES ('3ecfd538-c268-44cd-9bb7-e9cd75d3cfc6', 'b8e8a246-0548-4957-9427-dadc5b7d3490', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6760.00, 358.28, true, '2025-10-24 13:55:30.255297');
INSERT INTO public.deductions VALUES ('f165c219-afc1-45d5-9430-a03ea70a6e26', 'b8e8a246-0548-4957-9427-dadc5b7d3490', 'ALV', 'ALV Abzug', 1.1000, 6760.00, 74.36, true, '2025-10-24 13:55:30.255297');
INSERT INTO public.deductions VALUES ('c146db14-1ac7-4cae-be00-762926656ba6', 'b8e8a246-0548-4957-9427-dadc5b7d3490', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6760.00, 78.96, true, '2025-10-24 13:55:30.255297');
INSERT INTO public.deductions VALUES ('e20f7d4e-b657-48a1-b4ec-2d05fd4e3b05', 'b8e8a246-0548-4957-9427-dadc5b7d3490', 'BVG', 'Pensionskasse', NULL, NULL, 510.65, false, '2025-10-24 13:55:30.255297');
INSERT INTO public.deductions VALUES ('b600d3cb-3b60-456d-b621-387f33abb35b', 'f3479479-30e5-492b-aed3-b2e54e606dea', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-24 13:56:35.679782');
INSERT INTO public.deductions VALUES ('ea3c322e-431b-48ca-a5bc-433f02383bba', '8c152fbc-9ca1-42a2-8d0b-fbacfb29c5f1', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 392.00, 20.78, true, '2025-10-23 19:01:24.029016');
INSERT INTO public.deductions VALUES ('8efb3fb4-5346-4d38-ae22-08dc58066f89', '8c152fbc-9ca1-42a2-8d0b-fbacfb29c5f1', 'ALV', 'ALV Abzug', 1.1000, 392.00, 4.31, true, '2025-10-23 19:01:24.029016');
INSERT INTO public.deductions VALUES ('1f4a8a56-87c6-4a84-8fa4-27fa608d39e7', '8c152fbc-9ca1-42a2-8d0b-fbacfb29c5f1', 'NBU', 'NBU/SUVA Abzug', 1.1680, 392.00, 4.58, true, '2025-10-23 19:01:24.029016');
INSERT INTO public.deductions VALUES ('1266811c-d842-4715-96dc-16e0cc20daff', '06a73ccc-cd23-47e0-904c-1a668d573c1d', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-23 19:01:41.025797');
INSERT INTO public.deductions VALUES ('4786fd86-4089-4084-ae7d-6efc681e529b', '06a73ccc-cd23-47e0-904c-1a668d573c1d', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-23 19:01:41.025797');
INSERT INTO public.deductions VALUES ('fbf7b92b-445b-4835-aeb7-d178a261d2ca', '46cadb07-c540-413b-ace4-975e0af7d46d', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 10400.00, 551.20, true, '2025-10-23 19:01:58.583648');
INSERT INTO public.deductions VALUES ('7b940756-d441-4894-9259-3d3ccc4e8ea3', '46cadb07-c540-413b-ace4-975e0af7d46d', 'ALV', 'ALV Abzug', 1.1000, 10400.00, 114.40, true, '2025-10-23 19:01:58.583648');
INSERT INTO public.deductions VALUES ('f339dc86-cef0-476b-92b6-5fe30ceb25fe', '46cadb07-c540-413b-ace4-975e0af7d46d', 'NBU', 'NBU/SUVA Abzug', 1.1680, 10400.00, 121.47, true, '2025-10-23 19:01:58.583648');
INSERT INTO public.deductions VALUES ('9e1b4529-8115-467e-ac87-a36222ee58f2', '46cadb07-c540-413b-ace4-975e0af7d46d', 'BVG', 'Pensionskasse', NULL, NULL, 434.70, false, '2025-10-23 19:01:58.583648');
INSERT INTO public.deductions VALUES ('56c1bc18-ddfe-4708-80b5-b160c1c28805', 'a16d7773-756e-4d42-bbc4-6637779bd3ab', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 19150.00, 1014.95, true, '2025-10-23 19:02:25.497858');
INSERT INTO public.deductions VALUES ('5d01aa4f-2114-4b20-9cad-2c41217c8836', 'a16d7773-756e-4d42-bbc4-6637779bd3ab', 'ALV', 'ALV Abzug', 1.1000, 19150.00, 210.65, true, '2025-10-23 19:02:25.497858');
INSERT INTO public.deductions VALUES ('38abf160-0a3f-42dc-8978-35d044c754e1', 'a16d7773-756e-4d42-bbc4-6637779bd3ab', 'NBU', 'NBU/SUVA Abzug', 1.1680, 19150.00, 223.67, true, '2025-10-23 19:02:25.497858');
INSERT INTO public.deductions VALUES ('27284c9a-d5c9-4fa1-8d1c-cda5e9fcefba', 'a16d7773-756e-4d42-bbc4-6637779bd3ab', 'BVG', 'Pensionskasse', NULL, NULL, 581.75, false, '2025-10-23 19:02:25.497858');
INSERT INTO public.deductions VALUES ('cb181fb1-b4eb-4521-beb7-d549bcccbbbb', '4c53bca3-05a1-4fb6-84d3-a9d3c8c86500', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 12100.00, 641.30, true, '2025-10-24 11:40:09.378287');
INSERT INTO public.deductions VALUES ('5a59cf22-afce-4e0d-a1cb-309684748673', '4c53bca3-05a1-4fb6-84d3-a9d3c8c86500', 'ALV', 'ALV Abzug', 1.1000, 12100.00, 133.10, true, '2025-10-24 11:40:09.378287');
INSERT INTO public.deductions VALUES ('529eb680-45db-48e8-8091-f65c6c0be67c', '4c53bca3-05a1-4fb6-84d3-a9d3c8c86500', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12100.00, 141.33, true, '2025-10-24 11:40:09.378287');
INSERT INTO public.deductions VALUES ('a283f31e-da61-4c73-99c7-1f571e702e8c', '4c53bca3-05a1-4fb6-84d3-a9d3c8c86500', 'BVG', 'BVG Abzug', NULL, 12100.00, 524.85, true, '2025-10-24 11:40:09.378287');
INSERT INTO public.deductions VALUES ('5fb38b0f-dbc3-4afb-ac65-3c9561f4d8af', 'f6c9b0e1-dea1-4c83-ae70-86536a433962', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6100.00, 323.30, true, '2025-10-24 13:56:03.445006');
INSERT INTO public.deductions VALUES ('6ee919fe-8413-4cb5-940a-ec22e98e3382', 'f6c9b0e1-dea1-4c83-ae70-86536a433962', 'ALV', 'ALV Abzug', 1.1000, 6100.00, 67.10, true, '2025-10-24 13:56:03.445006');
INSERT INTO public.deductions VALUES ('5101fb74-4599-4d6e-9266-cf95da7663c9', 'f6c9b0e1-dea1-4c83-ae70-86536a433962', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6100.00, 71.25, true, '2025-10-24 13:56:03.445006');
INSERT INTO public.deductions VALUES ('79b19cc9-da5c-4266-8faa-335be1c2470b', 'f6c9b0e1-dea1-4c83-ae70-86536a433962', 'BVG', 'Pensionskasse', NULL, NULL, 407.05, false, '2025-10-24 13:56:03.445006');
INSERT INTO public.deductions VALUES ('d3c434c5-b8d9-4dc8-a775-5dbdfc5788f8', 'f3479479-30e5-492b-aed3-b2e54e606dea', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-24 13:56:35.679782');
INSERT INTO public.deductions VALUES ('485ab1ce-a6f2-4164-8375-c1e0e8600163', '3646b36d-9b29-4903-8fce-e12a03ec9306', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7450.00, 394.85, true, '2025-10-24 13:58:22.635539');
INSERT INTO public.deductions VALUES ('fa9fef43-cdba-415d-bca1-7370ed3a75ff', '3646b36d-9b29-4903-8fce-e12a03ec9306', 'ALV', 'ALV Abzug', 1.1000, 7450.00, 81.95, true, '2025-10-24 13:58:22.635539');
INSERT INTO public.deductions VALUES ('3b754d24-808c-4d4b-9026-c34863d9a9bd', '3646b36d-9b29-4903-8fce-e12a03ec9306', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7450.00, 87.02, true, '2025-10-24 13:58:22.635539');
INSERT INTO public.deductions VALUES ('a9daa3da-6c71-4e97-a89b-fc9bdefde4f9', '3646b36d-9b29-4903-8fce-e12a03ec9306', 'BVG', 'Pensionskasse', NULL, NULL, 524.85, false, '2025-10-24 13:58:22.635539');
INSERT INTO public.deductions VALUES ('12f98c87-f210-4074-93a7-19c9982d1610', '0860cb21-5b46-4911-8b6e-b5afd6d87e26', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7385.00, 391.40, true, '2025-10-24 13:58:38.08402');
INSERT INTO public.deductions VALUES ('ab7b095a-008c-47ba-aafe-a5f6afb4c38d', '0860cb21-5b46-4911-8b6e-b5afd6d87e26', 'ALV', 'ALV Abzug', 1.1000, 7385.00, 81.24, true, '2025-10-24 13:58:38.08402');
INSERT INTO public.deductions VALUES ('ac9be0e7-4b6c-4f03-8bce-f8c23ef90aaa', '0860cb21-5b46-4911-8b6e-b5afd6d87e26', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7385.00, 86.26, true, '2025-10-24 13:58:38.08402');
INSERT INTO public.deductions VALUES ('08aecf49-1d83-422d-a924-9ca7407f9336', 'c9800081-ebbd-4da0-bb06-532b5f1a9ebd', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 12100.00, 641.30, true, '2025-10-23 19:54:28.708976');
INSERT INTO public.deductions VALUES ('a209a7e3-a19d-45b4-9b02-b34797fff35e', 'c9800081-ebbd-4da0-bb06-532b5f1a9ebd', 'ALV', 'ALV Abzug', 1.1000, 12100.00, 133.10, true, '2025-10-23 19:54:28.708976');
INSERT INTO public.deductions VALUES ('c479b5f5-9570-4b00-b7d6-9ecaf53da05e', 'c9800081-ebbd-4da0-bb06-532b5f1a9ebd', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12100.00, 141.33, true, '2025-10-23 19:54:28.708976');
INSERT INTO public.deductions VALUES ('54365ee0-01d7-49d8-91de-a7f443cd5f56', 'c9800081-ebbd-4da0-bb06-532b5f1a9ebd', 'BVG', 'Pensionskasse', NULL, NULL, 823.05, false, '2025-10-23 19:54:28.708976');
INSERT INTO public.deductions VALUES ('19f2ddc1-a570-417c-9b6b-241f4e79c112', '0860cb21-5b46-4911-8b6e-b5afd6d87e26', 'BVG', 'Pensionskasse', NULL, NULL, 388.70, false, '2025-10-24 13:58:38.08402');
INSERT INTO public.deductions VALUES ('320bff83-3707-4841-bfcb-883a938182b3', 'c67cf0b6-e8ba-4582-8af2-a1390b76a777', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 245.00, 12.98, true, '2025-10-24 13:58:59.227747');
INSERT INTO public.deductions VALUES ('478ec7b2-fb69-4de5-b534-b35f213fe7e4', 'c67cf0b6-e8ba-4582-8af2-a1390b76a777', 'ALV', 'ALV Abzug', 1.1000, 245.00, 2.70, true, '2025-10-24 13:58:59.227747');
INSERT INTO public.deductions VALUES ('5ee818a3-6542-4f62-a9c7-06e587ef5071', 'c67cf0b6-e8ba-4582-8af2-a1390b76a777', 'NBU', 'NBU/SUVA Abzug', 1.1680, 245.00, 2.86, true, '2025-10-24 13:58:59.227747');
INSERT INTO public.deductions VALUES ('7f0e7476-65c6-4762-ad20-ab3f8ffaec1c', '09b1ab7a-7ff7-481f-b033-2a65b14bd8b1', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 245.00, 12.98, true, '2025-10-24 13:59:10.053227');
INSERT INTO public.deductions VALUES ('33cb3537-1735-40d7-9e13-e6fce043f739', '09b1ab7a-7ff7-481f-b033-2a65b14bd8b1', 'ALV', 'ALV Abzug', 1.1000, 245.00, 2.70, true, '2025-10-24 13:59:10.053227');
INSERT INTO public.deductions VALUES ('8aafb6cb-07eb-40af-8c18-903e843b65b1', '09b1ab7a-7ff7-481f-b033-2a65b14bd8b1', 'NBU', 'NBU/SUVA Abzug', 1.1680, 245.00, 2.86, true, '2025-10-24 13:59:10.053227');
INSERT INTO public.deductions VALUES ('0cb7c540-b934-4c38-9f47-c9e1b72033c3', '240413f1-1b0a-4bb4-9b91-f96791a4ebd8', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 392.00, 20.78, true, '2025-10-24 13:59:32.969509');
INSERT INTO public.deductions VALUES ('6a65ac68-a051-46e7-911c-b553e8ebfe71', '240413f1-1b0a-4bb4-9b91-f96791a4ebd8', 'ALV', 'ALV Abzug', 1.1000, 392.00, 4.31, true, '2025-10-24 13:59:32.969509');
INSERT INTO public.deductions VALUES ('b56f2aaf-cfce-406f-8b8c-3486e7df99fb', '240413f1-1b0a-4bb4-9b91-f96791a4ebd8', 'NBU', 'NBU/SUVA Abzug', 1.1680, 392.00, 4.58, true, '2025-10-24 13:59:32.969509');
INSERT INTO public.deductions VALUES ('6e6c97ed-681c-4832-8eef-b2018a9b0a2b', 'c1ae8ce6-cc1e-42f1-b9a7-c5c0857dd504', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-24 13:59:45.711872');
INSERT INTO public.deductions VALUES ('2034f8f4-0783-49d1-81be-179710d57eb8', 'c1ae8ce6-cc1e-42f1-b9a7-c5c0857dd504', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-24 13:59:45.711872');
INSERT INTO public.deductions VALUES ('07119f5f-0899-4eef-9971-995308f035e5', '02f60db0-1049-4d4a-a086-0a55bf8c6c02', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 8400.00, 445.20, true, '2025-10-24 13:59:56.947302');
INSERT INTO public.deductions VALUES ('8a68d652-00ee-447d-884e-829942e036b8', '02f60db0-1049-4d4a-a086-0a55bf8c6c02', 'ALV', 'ALV Abzug', 1.1000, 8400.00, 92.40, true, '2025-10-24 13:59:56.947302');
INSERT INTO public.deductions VALUES ('4c02054e-a3e6-4953-9c3f-d3a7a48b068b', '02f60db0-1049-4d4a-a086-0a55bf8c6c02', 'NBU', 'NBU/SUVA Abzug', 1.1680, 8400.00, 98.11, true, '2025-10-24 13:59:56.947302');
INSERT INTO public.deductions VALUES ('4224ae56-2f76-40e0-bbcb-cf589b842dee', '02f60db0-1049-4d4a-a086-0a55bf8c6c02', 'BVG', 'Pensionskasse', NULL, NULL, 434.70, false, '2025-10-24 13:59:56.947302');
INSERT INTO public.deductions VALUES ('f80606b5-08e3-4e42-b404-fe0c7eba632d', '3b71fc8f-c799-480f-915c-1db8da91f55d', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7150.00, 378.95, true, '2025-10-24 14:00:07.630927');
INSERT INTO public.deductions VALUES ('77654c65-b0e3-4673-8b92-780f12462124', '3b71fc8f-c799-480f-915c-1db8da91f55d', 'ALV', 'ALV Abzug', 1.1000, 7150.00, 78.65, true, '2025-10-24 14:00:07.630927');
INSERT INTO public.deductions VALUES ('f589ce28-f9bb-405b-a1f6-4e0af332e179', '3b71fc8f-c799-480f-915c-1db8da91f55d', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7150.00, 83.51, true, '2025-10-24 14:00:07.630927');
INSERT INTO public.deductions VALUES ('aac1cfab-54ab-4d54-ae42-f28f307ef51b', '3b71fc8f-c799-480f-915c-1db8da91f55d', 'BVG', 'Pensionskasse', NULL, NULL, 581.75, false, '2025-10-24 14:00:07.630927');
INSERT INTO public.deductions VALUES ('f25a41d1-a0dc-45fc-bcc2-09cab12532b4', 'e345bd6b-7b19-4f34-a269-f65bc97e2f70', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6760.00, 358.28, true, '2025-10-24 14:08:34.137756');
INSERT INTO public.deductions VALUES ('2a8e5ba9-7812-48f1-bdca-5d0d1948d4df', 'e345bd6b-7b19-4f34-a269-f65bc97e2f70', 'ALV', 'ALV Abzug', 1.1000, 6760.00, 74.36, true, '2025-10-24 14:08:34.137756');
INSERT INTO public.deductions VALUES ('12e14b31-12e2-4c6e-b0b1-b8002a887b51', 'e345bd6b-7b19-4f34-a269-f65bc97e2f70', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6760.00, 78.96, true, '2025-10-24 14:08:34.137756');
INSERT INTO public.deductions VALUES ('540edbb2-f4e4-4b27-a220-e1dab2780bc4', 'e345bd6b-7b19-4f34-a269-f65bc97e2f70', 'BVG', 'Pensionskasse', NULL, NULL, 510.65, false, '2025-10-24 14:08:34.137756');
INSERT INTO public.deductions VALUES ('07b376dd-e4aa-41a8-b259-578d04d60d9b', '42ee7e40-253d-460b-9268-07937fafc38a', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6100.00, 323.30, true, '2025-10-24 14:08:43.02444');
INSERT INTO public.deductions VALUES ('6201e85c-94bf-4f23-81f6-31b41091db60', '42ee7e40-253d-460b-9268-07937fafc38a', 'ALV', 'ALV Abzug', 1.1000, 6100.00, 67.10, true, '2025-10-24 14:08:43.02444');
INSERT INTO public.deductions VALUES ('6e49404f-e76a-486c-ae0a-2d598611de98', '42ee7e40-253d-460b-9268-07937fafc38a', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6100.00, 71.25, true, '2025-10-24 14:08:43.02444');
INSERT INTO public.deductions VALUES ('be97b58f-7d50-4d80-a6d2-91e9bf42f71e', '42ee7e40-253d-460b-9268-07937fafc38a', 'BVG', 'Pensionskasse', NULL, NULL, 407.05, false, '2025-10-24 14:08:43.02444');
INSERT INTO public.deductions VALUES ('eeef9bd6-709e-4f67-935c-b37439f36ac1', 'b947086a-1e59-4502-88da-ff12ef128331', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 950.00, 50.35, true, '2025-10-24 14:08:55.345053');
INSERT INTO public.deductions VALUES ('8edc7e3d-2ac1-49e0-919d-7bac160a532b', 'b947086a-1e59-4502-88da-ff12ef128331', 'ALV', 'ALV Abzug', 1.1000, 950.00, 10.45, true, '2025-10-24 14:08:55.345053');
INSERT INTO public.deductions VALUES ('7eaccb07-d82b-4045-893f-120ab9c4d8fd', 'b947086a-1e59-4502-88da-ff12ef128331', 'NBU', 'NBU/SUVA Abzug', 1.1680, 950.00, 11.10, true, '2025-10-24 14:08:55.345053');
INSERT INTO public.deductions VALUES ('21034220-0af6-4fa3-85ec-df8466becc5b', '75e9c271-4c6f-4a6e-bc81-8ed25cbe8b19', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-24 14:09:08.958081');
INSERT INTO public.deductions VALUES ('219a106c-a597-453c-b22b-ab5480d4e0ff', '75e9c271-4c6f-4a6e-bc81-8ed25cbe8b19', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-24 14:09:08.958081');
INSERT INTO public.deductions VALUES ('bf8f6206-b2c6-4bc8-b326-5b49ffdd0fc1', '0686ccfd-2d18-4a14-a485-c8aec811450d', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7450.00, 394.85, true, '2025-10-24 14:10:23.53985');
INSERT INTO public.deductions VALUES ('661b2301-cb74-4bf2-b86b-6718130d057b', '0686ccfd-2d18-4a14-a485-c8aec811450d', 'ALV', 'ALV Abzug', 1.1000, 7450.00, 81.95, true, '2025-10-24 14:10:23.53985');
INSERT INTO public.deductions VALUES ('4a8f3c86-4eb4-4b64-97df-343d6c8a1e07', '0686ccfd-2d18-4a14-a485-c8aec811450d', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7450.00, 87.02, true, '2025-10-24 14:10:23.53985');
INSERT INTO public.deductions VALUES ('808536ed-654c-4cd5-855a-22977ade443e', '0686ccfd-2d18-4a14-a485-c8aec811450d', 'BVG', 'Pensionskasse', NULL, NULL, 524.85, false, '2025-10-24 14:10:23.53985');
INSERT INTO public.deductions VALUES ('20deeb1a-bd6b-481a-9597-5ea542463a01', '4a19245d-cded-4261-9eed-bd1c0ef39789', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7385.00, 391.40, true, '2025-10-24 14:10:38.855691');
INSERT INTO public.deductions VALUES ('5a4cbc70-23cf-4b8b-bdd4-760f1ef02456', '4a19245d-cded-4261-9eed-bd1c0ef39789', 'ALV', 'ALV Abzug', 1.1000, 7385.00, 81.24, true, '2025-10-24 14:10:38.855691');
INSERT INTO public.deductions VALUES ('4b5711a4-0136-4f31-b83e-1953edeb5504', '4a19245d-cded-4261-9eed-bd1c0ef39789', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7385.00, 86.26, true, '2025-10-24 14:10:38.855691');
INSERT INTO public.deductions VALUES ('e47b4466-27c0-4697-a645-c26e31893e46', '4a19245d-cded-4261-9eed-bd1c0ef39789', 'BVG', 'Pensionskasse', NULL, NULL, 388.70, false, '2025-10-24 14:10:38.855691');
INSERT INTO public.deductions VALUES ('22c4fb04-a1f6-4db4-a073-b880e45903f8', '8837d1da-bf86-4e51-8248-1bf0849353e6', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 437.50, 23.19, true, '2025-10-24 14:11:01.927423');
INSERT INTO public.deductions VALUES ('c3fd86f5-63f4-4831-a891-339724c34a1a', '8837d1da-bf86-4e51-8248-1bf0849353e6', 'ALV', 'ALV Abzug', 1.1000, 437.50, 4.81, true, '2025-10-24 14:11:01.927423');
INSERT INTO public.deductions VALUES ('299286e7-e62d-4242-9df2-295728c91927', '8837d1da-bf86-4e51-8248-1bf0849353e6', 'NBU', 'NBU/SUVA Abzug', 1.1680, 437.50, 5.11, true, '2025-10-24 14:11:01.927423');
INSERT INTO public.deductions VALUES ('cb6b20e4-9527-4782-ac38-9afcdfbe8e73', 'fdc160eb-4033-4b59-8480-f58107172ba2', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 437.50, 23.19, true, '2025-10-24 14:11:14.346776');
INSERT INTO public.deductions VALUES ('6d2d3749-ca44-4e82-8b99-63e77c0d9ed2', 'fdc160eb-4033-4b59-8480-f58107172ba2', 'ALV', 'ALV Abzug', 1.1000, 437.50, 4.81, true, '2025-10-24 14:11:14.346776');
INSERT INTO public.deductions VALUES ('52eb0b58-cb99-400c-9805-ddad11bc9fc1', 'fdc160eb-4033-4b59-8480-f58107172ba2', 'NBU', 'NBU/SUVA Abzug', 1.1680, 437.50, 5.11, true, '2025-10-24 14:11:14.346776');
INSERT INTO public.deductions VALUES ('9269a59b-973a-45c4-89f6-9f59b4af22ab', '390e74c3-0645-4a5d-b0d8-2983f8f06ddf', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 392.00, 20.78, true, '2025-10-24 14:11:43.322453');
INSERT INTO public.deductions VALUES ('1d2c812b-eda9-41ce-91bc-ff9b9cc55ed6', '390e74c3-0645-4a5d-b0d8-2983f8f06ddf', 'ALV', 'ALV Abzug', 1.1000, 392.00, 4.31, true, '2025-10-24 14:11:43.322453');
INSERT INTO public.deductions VALUES ('f91ba6c6-b6fa-4395-a029-78925c2888a9', '390e74c3-0645-4a5d-b0d8-2983f8f06ddf', 'NBU', 'NBU/SUVA Abzug', 1.1680, 392.00, 4.58, true, '2025-10-24 14:11:43.322453');
INSERT INTO public.deductions VALUES ('bbf09840-89b0-4382-998a-b51b80a79494', '3933a5c8-67dc-455f-81a3-e053916b8a77', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-24 14:11:54.946532');
INSERT INTO public.deductions VALUES ('3c33b592-118a-4a67-80e3-911163b25a0b', '3933a5c8-67dc-455f-81a3-e053916b8a77', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-24 14:11:54.946532');
INSERT INTO public.deductions VALUES ('c7cafe75-d448-4502-871e-c4c41de6c33b', '1a12b6eb-5317-4247-a222-9ffebc35282c', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 8400.00, 445.20, true, '2025-10-24 14:12:08.695604');
INSERT INTO public.deductions VALUES ('637bf8db-cdfd-443c-82d5-c8f928312998', '1a12b6eb-5317-4247-a222-9ffebc35282c', 'ALV', 'ALV Abzug', 1.1000, 8400.00, 92.40, true, '2025-10-24 14:12:08.695604');
INSERT INTO public.deductions VALUES ('347a54be-4040-4a95-9815-943d3fc02f7f', '1a12b6eb-5317-4247-a222-9ffebc35282c', 'NBU', 'NBU/SUVA Abzug', 1.1680, 8400.00, 98.11, true, '2025-10-24 14:12:08.695604');
INSERT INTO public.deductions VALUES ('04bbff7c-a946-4e81-b362-3eaf6cdfea75', '1a12b6eb-5317-4247-a222-9ffebc35282c', 'BVG', 'Pensionskasse', NULL, NULL, 434.70, false, '2025-10-24 14:12:08.695604');
INSERT INTO public.deductions VALUES ('faf499bd-40c8-4cf1-9613-4af79bc77238', '5a129ebc-3cdb-4f7e-a2db-3c294c0121f8', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7150.00, 378.95, true, '2025-10-24 14:12:18.150779');
INSERT INTO public.deductions VALUES ('e33038d5-0f12-42f9-96c6-cbb8bd42dcf0', '5a129ebc-3cdb-4f7e-a2db-3c294c0121f8', 'ALV', 'ALV Abzug', 1.1000, 7150.00, 78.65, true, '2025-10-24 14:12:18.150779');
INSERT INTO public.deductions VALUES ('10033a8a-aa8d-448f-87f8-f2cefa5d0f9c', '5a129ebc-3cdb-4f7e-a2db-3c294c0121f8', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7150.00, 83.51, true, '2025-10-24 14:12:18.150779');
INSERT INTO public.deductions VALUES ('9eb0af7d-7c38-4304-84e1-b81d4d9b1470', '5a129ebc-3cdb-4f7e-a2db-3c294c0121f8', 'BVG', 'Pensionskasse', NULL, NULL, 581.75, false, '2025-10-24 14:12:18.150779');
INSERT INTO public.deductions VALUES ('95516233-a001-413f-b4fc-25d529cb26ab', '648f345d-1cea-4933-b6a1-5f98f69fa805', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 12100.00, 641.30, true, '2025-10-24 15:20:25.175734');
INSERT INTO public.deductions VALUES ('46f415b9-0fe0-4696-a42a-78d262943d59', '648f345d-1cea-4933-b6a1-5f98f69fa805', 'ALV', 'ALV Abzug', 1.1000, 12350.00, 135.85, true, '2025-10-24 15:20:25.175734');
INSERT INTO public.deductions VALUES ('96009807-28d7-4d09-b413-12c5d1036d13', '648f345d-1cea-4933-b6a1-5f98f69fa805', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12350.00, 144.25, true, '2025-10-24 15:20:25.175734');
INSERT INTO public.deductions VALUES ('2fee087c-946f-44ad-a2be-44a65b7fa8e6', '648f345d-1cea-4933-b6a1-5f98f69fa805', 'BVG', 'BVG Abzug', NULL, 12100.00, 823.05, true, '2025-10-24 15:20:25.175734');
INSERT INTO public.deductions VALUES ('71cfb8c1-4214-4ab5-aadc-e0d9025dca9d', 'e427fdc9-c18f-48d0-9fd8-007567dfd11f', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 12100.00, 641.30, true, '2025-10-24 15:29:42.98269');
INSERT INTO public.deductions VALUES ('6e71fcc9-b02a-47cf-9713-833a46cc109a', 'e427fdc9-c18f-48d0-9fd8-007567dfd11f', 'ALV', 'ALV Abzug', 1.1000, 12350.00, 135.85, true, '2025-10-24 15:29:42.98269');
INSERT INTO public.deductions VALUES ('ce61b1ba-77e0-49cb-86b9-14f44af149d8', 'e427fdc9-c18f-48d0-9fd8-007567dfd11f', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12350.00, 144.25, true, '2025-10-24 15:29:42.98269');
INSERT INTO public.deductions VALUES ('44f2b1dc-1e6f-4a2f-91d1-32120233e47d', 'e427fdc9-c18f-48d0-9fd8-007567dfd11f', 'BVG', 'Pensionskasse', NULL, NULL, 823.05, false, '2025-10-24 15:29:42.98269');
INSERT INTO public.deductions VALUES ('82f092cb-f347-4338-999f-92f7fc6ef5a5', 'eb545dd1-5fca-4c98-b476-ee39af8d97dc', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6760.00, 358.28, true, '2025-10-24 16:35:56.372917');
INSERT INTO public.deductions VALUES ('8a6da2da-f311-45d2-9e01-dd4ec6b88980', 'eb545dd1-5fca-4c98-b476-ee39af8d97dc', 'ALV', 'ALV Abzug', 1.1000, 6760.00, 74.36, true, '2025-10-24 16:35:56.372917');
INSERT INTO public.deductions VALUES ('9a7a82f7-08c5-4a38-870b-61e67bb79af7', 'eb545dd1-5fca-4c98-b476-ee39af8d97dc', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6760.00, 78.96, true, '2025-10-24 16:35:56.372917');
INSERT INTO public.deductions VALUES ('d46fda03-b7cb-464a-815a-5b0aa408b04d', 'eb545dd1-5fca-4c98-b476-ee39af8d97dc', 'BVG', 'Pensionskasse', NULL, NULL, 510.65, false, '2025-10-24 16:35:56.372917');
INSERT INTO public.deductions VALUES ('011ead3d-c214-4a91-a2b2-25f93159b827', 'f92ff264-e35e-4847-b10f-ffc185969658', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6100.00, 323.30, true, '2025-10-24 16:36:03.731409');
INSERT INTO public.deductions VALUES ('7503484c-b445-45b1-9e1c-7d1b2c25e2b6', 'f92ff264-e35e-4847-b10f-ffc185969658', 'ALV', 'ALV Abzug', 1.1000, 6100.00, 67.10, true, '2025-10-24 16:36:03.731409');
INSERT INTO public.deductions VALUES ('97e38874-3b0d-42da-9b34-9bb72f9e9ee7', 'f92ff264-e35e-4847-b10f-ffc185969658', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6100.00, 71.25, true, '2025-10-24 16:36:03.731409');
INSERT INTO public.deductions VALUES ('9c33f721-be27-4bb1-9fc2-863321242f33', 'f92ff264-e35e-4847-b10f-ffc185969658', 'BVG', 'Pensionskasse', NULL, NULL, 407.05, false, '2025-10-24 16:36:03.731409');
INSERT INTO public.deductions VALUES ('836a095a-28ca-46fe-8bff-6c997e36e1f4', '37aafcd2-69c7-4d12-aa39-2dc346a5ddfd', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 500.00, 26.50, true, '2025-10-24 16:36:32.223856');
INSERT INTO public.deductions VALUES ('24f49dcb-87cd-4809-9e0e-67faffb06fd9', '37aafcd2-69c7-4d12-aa39-2dc346a5ddfd', 'ALV', 'ALV Abzug', 1.1000, 500.00, 5.50, true, '2025-10-24 16:36:32.223856');
INSERT INTO public.deductions VALUES ('682668ef-140a-496d-adbd-f9048d6e9773', '37aafcd2-69c7-4d12-aa39-2dc346a5ddfd', 'NBU', 'NBU/SUVA Abzug', 1.1680, 500.00, 5.84, true, '2025-10-24 16:36:32.223856');
INSERT INTO public.deductions VALUES ('6b678df8-437f-4bcd-a82b-095bc72af902', 'b59ff4da-d0f2-4ef4-be63-978359f01477', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 12100.00, 641.30, true, '2025-10-24 16:51:18.041324');
INSERT INTO public.deductions VALUES ('b4fea8a1-cc21-422e-9714-47e23d34b515', 'b59ff4da-d0f2-4ef4-be63-978359f01477', 'ALV', 'ALV Abzug', 1.1000, 12350.00, 135.85, true, '2025-10-24 16:51:18.041324');
INSERT INTO public.deductions VALUES ('a0fca02c-c1b5-496f-bdcd-bf3851a8409f', 'b59ff4da-d0f2-4ef4-be63-978359f01477', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12350.00, 144.25, true, '2025-10-24 16:51:18.041324');
INSERT INTO public.deductions VALUES ('fe7357b8-926a-424b-b5c2-ad00ec0b9c9e', 'b59ff4da-d0f2-4ef4-be63-978359f01477', 'BVG', 'BVG Abzug', NULL, 12100.00, 823.05, true, '2025-10-24 16:51:18.041324');
INSERT INTO public.deductions VALUES ('0541d0e6-e7c2-4783-bec0-d059059d73b7', 'bae209f8-8315-476c-9b87-74800d87301e', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7450.00, 394.85, true, '2025-10-24 16:51:47.331993');
INSERT INTO public.deductions VALUES ('c08d090e-95e8-45b9-978a-8c03e5b4ba89', 'bae209f8-8315-476c-9b87-74800d87301e', 'ALV', 'ALV Abzug', 1.1000, 7450.00, 81.95, true, '2025-10-24 16:51:47.331993');
INSERT INTO public.deductions VALUES ('cb83266e-e226-47ad-a9fc-e0e8f54d8372', 'bae209f8-8315-476c-9b87-74800d87301e', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7450.00, 87.02, true, '2025-10-24 16:51:47.331993');
INSERT INTO public.deductions VALUES ('aa103388-93aa-439f-8f49-3218e3650400', 'bae209f8-8315-476c-9b87-74800d87301e', 'BVG', 'BVG Abzug', NULL, 7450.00, 524.85, true, '2025-10-24 16:51:47.331993');
INSERT INTO public.deductions VALUES ('667f1b5f-7f06-49ed-8f12-149dc0504bdc', 'd42296ea-ae6b-4758-af6a-18ddc4413843', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7385.00, 391.40, true, '2025-10-24 16:51:59.738618');
INSERT INTO public.deductions VALUES ('5fe76de0-7a5b-4bc9-a90f-9f3099068d7c', 'd42296ea-ae6b-4758-af6a-18ddc4413843', 'ALV', 'ALV Abzug', 1.1000, 7385.00, 81.24, true, '2025-10-24 16:51:59.738618');
INSERT INTO public.deductions VALUES ('b34c7d4c-645f-4721-8e68-f2f87745018c', 'd42296ea-ae6b-4758-af6a-18ddc4413843', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7385.00, 86.26, true, '2025-10-24 16:51:59.738618');
INSERT INTO public.deductions VALUES ('1a21f7d3-309a-47f1-857b-af07b02e8a6e', 'd42296ea-ae6b-4758-af6a-18ddc4413843', 'BVG', 'BVG Abzug', NULL, 7385.00, 388.70, true, '2025-10-24 16:51:59.738618');
INSERT INTO public.deductions VALUES ('d7116019-fcea-4ee0-b32d-73c2470694fb', '02c7e1fb-8197-4629-863c-d7f4ef173909', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 245.00, 12.98, true, '2025-10-24 16:52:28.751229');
INSERT INTO public.deductions VALUES ('5c2a9dff-fa6d-4b7d-a89d-4ddd99e9b2ec', '02c7e1fb-8197-4629-863c-d7f4ef173909', 'ALV', 'ALV Abzug', 1.1000, 245.00, 2.70, true, '2025-10-24 16:52:28.751229');
INSERT INTO public.deductions VALUES ('bc4de5c0-d4a7-4b5e-bbf3-dfbde8458cc3', '02c7e1fb-8197-4629-863c-d7f4ef173909', 'NBU', 'NBU/SUVA Abzug', 1.1680, 245.00, 2.86, true, '2025-10-24 16:52:28.751229');
INSERT INTO public.deductions VALUES ('6d726825-3e42-4b6c-9721-2db8a98eba54', 'd5d8276e-1784-4fbe-9cb2-5c07399a834a', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 245.00, 12.98, true, '2025-10-24 16:52:41.507595');
INSERT INTO public.deductions VALUES ('6ccb6fa5-236d-4dc9-bd14-28b38bdb54b6', 'd5d8276e-1784-4fbe-9cb2-5c07399a834a', 'ALV', 'ALV Abzug', 1.1000, 245.00, 2.70, true, '2025-10-24 16:52:41.507595');
INSERT INTO public.deductions VALUES ('ad735f32-ff51-419c-b211-ce626352cd2b', 'd5d8276e-1784-4fbe-9cb2-5c07399a834a', 'NBU', 'NBU/SUVA Abzug', 1.1680, 245.00, 2.86, true, '2025-10-24 16:52:41.507595');
INSERT INTO public.deductions VALUES ('a89096b1-8847-47c0-8898-db9ff9729534', '9149bc93-6bf1-406f-a281-b44878b2ff4f', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 392.00, 20.78, true, '2025-10-24 16:54:02.053281');
INSERT INTO public.deductions VALUES ('93cd19ac-134c-4c7a-b73f-ebb9a92f2a72', '9149bc93-6bf1-406f-a281-b44878b2ff4f', 'ALV', 'ALV Abzug', 1.1000, 392.00, 4.31, true, '2025-10-24 16:54:02.053281');
INSERT INTO public.deductions VALUES ('6f9cfb58-77c5-4606-8bca-d5f9ebb8baa0', '9149bc93-6bf1-406f-a281-b44878b2ff4f', 'NBU', 'NBU/SUVA Abzug', 1.1680, 392.00, 4.58, true, '2025-10-24 16:54:02.053281');
INSERT INTO public.deductions VALUES ('aba1ec85-4c95-4be6-b100-04c8bc177021', '32f45d66-e402-45ca-a7dd-ff9a95bc6785', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-24 16:56:11.329069');
INSERT INTO public.deductions VALUES ('cd476659-e04e-48e6-8d8d-356aa4fb5787', '32f45d66-e402-45ca-a7dd-ff9a95bc6785', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-24 16:56:11.329069');
INSERT INTO public.deductions VALUES ('df7a4fc8-9c8f-40bb-b400-27690e05459f', '7f606abf-06a2-41ab-b072-9a2586114246', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 8400.00, 445.20, true, '2025-10-24 16:56:23.057663');
INSERT INTO public.deductions VALUES ('2b9344f3-36ce-45cd-a524-23ddb6cfb331', '7f606abf-06a2-41ab-b072-9a2586114246', 'ALV', 'ALV Abzug', 1.1000, 8400.00, 92.40, true, '2025-10-24 16:56:23.057663');
INSERT INTO public.deductions VALUES ('7e72cdee-e93d-4123-b407-31ed7788372a', '7f606abf-06a2-41ab-b072-9a2586114246', 'NBU', 'NBU/SUVA Abzug', 1.1680, 8400.00, 98.11, true, '2025-10-24 16:56:23.057663');
INSERT INTO public.deductions VALUES ('bf4297ee-4c31-456a-b7c1-1abc1f804e13', '7f606abf-06a2-41ab-b072-9a2586114246', 'BVG', 'BVG Abzug', NULL, 8400.00, 434.70, true, '2025-10-24 16:56:23.057663');
INSERT INTO public.deductions VALUES ('288bc050-ddae-4d4d-8076-f0cd32fa7ae6', 'c17cf0d1-2cc5-47b3-8ea4-7a9682b5bebb', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7150.00, 378.95, true, '2025-10-24 16:56:32.753539');
INSERT INTO public.deductions VALUES ('42ccabdb-2567-45f1-9ce0-a9d2f38a0675', 'c17cf0d1-2cc5-47b3-8ea4-7a9682b5bebb', 'ALV', 'ALV Abzug', 1.1000, 7150.00, 78.65, true, '2025-10-24 16:56:32.753539');
INSERT INTO public.deductions VALUES ('174f5018-5cb6-44a9-90ce-005eb32d2bdf', 'c17cf0d1-2cc5-47b3-8ea4-7a9682b5bebb', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7150.00, 83.51, true, '2025-10-24 16:56:32.753539');
INSERT INTO public.deductions VALUES ('02c7780d-7bda-4c21-8299-743d578ceba3', 'c17cf0d1-2cc5-47b3-8ea4-7a9682b5bebb', 'BVG', 'BVG Abzug', NULL, 7150.00, 581.75, true, '2025-10-24 16:56:32.753539');
INSERT INTO public.deductions VALUES ('755599ae-23c5-4b27-83ae-d1752204d988', '78058e9e-36c2-473a-ac0a-cdecfd29043b', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 12100.00, 641.30, true, '2025-10-24 16:57:07.512773');
INSERT INTO public.deductions VALUES ('5f7dc91e-0128-4ccf-bd13-7b789f926cfe', '78058e9e-36c2-473a-ac0a-cdecfd29043b', 'ALV', 'ALV Abzug', 1.1000, 12350.00, 135.85, true, '2025-10-24 16:57:07.512773');
INSERT INTO public.deductions VALUES ('d20b2b7f-d80b-42db-be07-a67777caf21c', '78058e9e-36c2-473a-ac0a-cdecfd29043b', 'NBU', 'NBU/SUVA Abzug', 1.1680, 12350.00, 144.25, true, '2025-10-24 16:57:07.512773');
INSERT INTO public.deductions VALUES ('36faf5f4-46f0-4308-964b-b835c0529b5d', '78058e9e-36c2-473a-ac0a-cdecfd29043b', 'BVG', 'BVG Abzug', NULL, 12100.00, 823.05, true, '2025-10-24 16:57:07.512773');
INSERT INTO public.deductions VALUES ('904f2581-1600-47ae-977c-754618b38713', '7353d0c5-bc59-4e9e-8aa8-178b63c22823', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6760.00, 358.28, true, '2025-10-24 17:17:35.991564');
INSERT INTO public.deductions VALUES ('2f383bb7-9460-483f-9700-0c8c656ff1e9', '7353d0c5-bc59-4e9e-8aa8-178b63c22823', 'ALV', 'ALV Abzug', 1.1000, 6760.00, 74.36, true, '2025-10-24 17:17:35.991564');
INSERT INTO public.deductions VALUES ('84e1a887-ff08-45ce-84b9-9f1aa3b6f1f5', '7353d0c5-bc59-4e9e-8aa8-178b63c22823', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6760.00, 78.96, true, '2025-10-24 17:17:35.991564');
INSERT INTO public.deductions VALUES ('d9664e76-5d4e-43ed-9884-1fefe6c84c15', '7353d0c5-bc59-4e9e-8aa8-178b63c22823', 'BVG', 'BVG Abzug', NULL, 6760.00, 510.65, true, '2025-10-24 17:17:35.991564');
INSERT INTO public.deductions VALUES ('2a949d56-c5bd-478c-a726-4632a87ef920', '48cf7161-9b35-4cbd-bc64-4738ae6979eb', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-24 17:34:37.876151');
INSERT INTO public.deductions VALUES ('c7aecae8-9d35-4cac-adbb-104c1b8369ed', '48cf7161-9b35-4cbd-bc64-4738ae6979eb', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-24 17:34:37.876151');
INSERT INTO public.deductions VALUES ('ee25b1e3-7d0d-4dd8-9e33-be43090d9256', '8cf78e3f-b561-47d4-9601-3194ce8f9d03', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7450.00, 394.85, true, '2025-10-24 19:06:37.465994');
INSERT INTO public.deductions VALUES ('f0a92ede-f481-49f2-ba18-786c98507bac', '8cf78e3f-b561-47d4-9601-3194ce8f9d03', 'ALV', 'ALV Abzug', 1.1000, 7450.00, 81.95, true, '2025-10-24 19:06:37.465994');
INSERT INTO public.deductions VALUES ('7e5a2262-7328-4fbf-945e-c79d0c246e8a', '8cf78e3f-b561-47d4-9601-3194ce8f9d03', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7450.00, 87.02, true, '2025-10-24 19:06:37.465994');
INSERT INTO public.deductions VALUES ('c38cae1e-54df-489e-8071-8fad39694f34', '8cf78e3f-b561-47d4-9601-3194ce8f9d03', 'BVG', 'BVG Abzug', NULL, 7450.00, 524.85, true, '2025-10-24 19:06:37.465994');
INSERT INTO public.deductions VALUES ('ed5c7751-8c44-4336-8e36-2b35b2969b28', 'c47ae371-fb0e-4edc-9494-8a2564fe3fd5', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7385.00, 391.40, true, '2025-10-24 19:06:47.450198');
INSERT INTO public.deductions VALUES ('1dcd29c7-5675-4782-8ee9-8a4eacd32e23', 'c47ae371-fb0e-4edc-9494-8a2564fe3fd5', 'ALV', 'ALV Abzug', 1.1000, 7385.00, 81.24, true, '2025-10-24 19:06:47.450198');
INSERT INTO public.deductions VALUES ('ff784f24-0197-4052-8a32-4ed0110b494c', 'c47ae371-fb0e-4edc-9494-8a2564fe3fd5', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7385.00, 86.26, true, '2025-10-24 19:06:47.450198');
INSERT INTO public.deductions VALUES ('abe3e776-b3d5-41e6-8134-e94ed7fc906f', 'c47ae371-fb0e-4edc-9494-8a2564fe3fd5', 'BVG', 'BVG Abzug', NULL, 7385.00, 388.70, true, '2025-10-24 19:06:47.450198');
INSERT INTO public.deductions VALUES ('23804d66-c2fe-446c-80e8-c1bac410fc79', '5dcf2d2a-40ec-482f-9297-758d5724c148', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 332.50, 17.62, true, '2025-10-24 19:07:06.682902');
INSERT INTO public.deductions VALUES ('2c92eeea-9bc0-4a6b-b705-ae9b07ce0d6e', '5dcf2d2a-40ec-482f-9297-758d5724c148', 'ALV', 'ALV Abzug', 1.1000, 332.50, 3.66, true, '2025-10-24 19:07:06.682902');
INSERT INTO public.deductions VALUES ('4fda9193-e15e-4810-a829-59a3ddb3aac2', '5dcf2d2a-40ec-482f-9297-758d5724c148', 'NBU', 'NBU/SUVA Abzug', 1.1680, 332.50, 3.88, true, '2025-10-24 19:07:06.682902');
INSERT INTO public.deductions VALUES ('1ea55ed3-36f5-495a-b85a-ea55c6ec200e', '54080893-ad3f-4958-b6cb-2bcefadbbf37', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 8400.00, 445.20, true, '2025-10-25 06:22:42.792803');
INSERT INTO public.deductions VALUES ('b85ef963-5446-4cca-8d8b-9ef75265ff5a', '38b4ae58-e6b5-477d-abb7-ee270a33d936', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 332.50, 17.62, true, '2025-10-24 19:07:55.47211');
INSERT INTO public.deductions VALUES ('a5afdc61-affd-4c2f-a2a3-5bbf841ecd61', '38b4ae58-e6b5-477d-abb7-ee270a33d936', 'ALV', 'ALV Abzug', 1.1000, 332.50, 3.66, true, '2025-10-24 19:07:55.47211');
INSERT INTO public.deductions VALUES ('a62febd9-a437-4685-8ea4-eb5164f89619', '38b4ae58-e6b5-477d-abb7-ee270a33d936', 'NBU', 'NBU/SUVA Abzug', 1.1680, 332.50, 3.88, true, '2025-10-24 19:07:55.47211');
INSERT INTO public.deductions VALUES ('a0e0d786-d76f-480e-8b99-ab774d5574e6', '140b86bd-11ee-4a72-a45e-0459c82206a9', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-24 19:08:05.292908');
INSERT INTO public.deductions VALUES ('5deb05c2-a825-49aa-9e3e-a00a9358a51b', '140b86bd-11ee-4a72-a45e-0459c82206a9', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-24 19:08:05.292908');
INSERT INTO public.deductions VALUES ('b10e488f-f9b6-4f75-9614-3c72bee23008', '87ad95d8-0add-426d-a7f0-9ad266865cba', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 8400.00, 445.20, true, '2025-10-24 19:08:16.111646');
INSERT INTO public.deductions VALUES ('7ec4c240-bcd6-4f00-aa24-c2c51ac047a8', '87ad95d8-0add-426d-a7f0-9ad266865cba', 'ALV', 'ALV Abzug', 1.1000, 8400.00, 92.40, true, '2025-10-24 19:08:16.111646');
INSERT INTO public.deductions VALUES ('52b9ba73-4aa9-4062-8397-e4ece6f5ce90', '87ad95d8-0add-426d-a7f0-9ad266865cba', 'NBU', 'NBU/SUVA Abzug', 1.1680, 8400.00, 98.11, true, '2025-10-24 19:08:16.111646');
INSERT INTO public.deductions VALUES ('ce6840af-849b-4a43-a6fe-0a763d98c512', '87ad95d8-0add-426d-a7f0-9ad266865cba', 'BVG', 'BVG Abzug', NULL, 8400.00, 434.70, true, '2025-10-24 19:08:16.111646');
INSERT INTO public.deductions VALUES ('3c9f2fe5-d42c-4e13-87c1-bda02ba96e9d', 'bcb0eb1a-1a38-4e7f-83eb-0c5475c978a5', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7150.00, 378.95, true, '2025-10-24 19:08:25.575018');
INSERT INTO public.deductions VALUES ('5e5b673a-7232-4aa3-ab6f-7f22d092a3a0', 'bcb0eb1a-1a38-4e7f-83eb-0c5475c978a5', 'ALV', 'ALV Abzug', 1.1000, 7150.00, 78.65, true, '2025-10-24 19:08:25.575018');
INSERT INTO public.deductions VALUES ('bb24389d-6c15-4953-a5fc-14c8aef12f44', 'bcb0eb1a-1a38-4e7f-83eb-0c5475c978a5', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7150.00, 83.51, true, '2025-10-24 19:08:25.575018');
INSERT INTO public.deductions VALUES ('59e53dee-3e38-4b1f-9442-78b0362b8d36', 'bcb0eb1a-1a38-4e7f-83eb-0c5475c978a5', 'BVG', 'BVG Abzug', NULL, 7150.00, 581.75, true, '2025-10-24 19:08:25.575018');
INSERT INTO public.deductions VALUES ('483ac478-f056-4200-a1a0-69d838d25235', 'f0c58438-75fe-4491-918d-56211af3f89a', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 10000.00, 530.00, true, '2025-10-24 19:10:59.653642');
INSERT INTO public.deductions VALUES ('ba29fcbe-a393-427f-a58c-6a4efe6cb871', 'f0c58438-75fe-4491-918d-56211af3f89a', 'ALV', 'ALV Abzug', 1.1000, 10000.00, 110.00, true, '2025-10-24 19:10:59.653642');
INSERT INTO public.deductions VALUES ('9a466d83-a708-4789-9046-ad382f6d7baa', 'f0c58438-75fe-4491-918d-56211af3f89a', 'NBU', 'NBU/SUVA Abzug', 1.1680, 10000.00, 116.80, true, '2025-10-24 19:10:59.653642');
INSERT INTO public.deductions VALUES ('59e5dc64-a32a-4d1b-9ad3-98b5554874be', 'f0c58438-75fe-4491-918d-56211af3f89a', 'BVG', 'BVG Abzug', NULL, 10000.00, 813.40, true, '2025-10-24 19:10:59.653642');
INSERT INTO public.deductions VALUES ('d3d7aa1a-bd26-4733-ad15-e07004f548d3', 'cbdce295-2f42-4b76-b3c1-c48319f14c83', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6100.00, 323.30, true, '2025-10-24 19:13:58.471304');
INSERT INTO public.deductions VALUES ('9f831781-846a-4d84-af1b-191c03703885', 'cbdce295-2f42-4b76-b3c1-c48319f14c83', 'ALV', 'ALV Abzug', 1.1000, 6100.00, 67.10, true, '2025-10-24 19:13:58.471304');
INSERT INTO public.deductions VALUES ('26911707-d7a9-4d8a-9131-c631f7d0a455', 'cbdce295-2f42-4b76-b3c1-c48319f14c83', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6100.00, 71.25, true, '2025-10-24 19:13:58.471304');
INSERT INTO public.deductions VALUES ('f4b02653-2259-4091-a48a-355b80d28944', 'cbdce295-2f42-4b76-b3c1-c48319f14c83', 'BVG', 'BVG Abzug', NULL, 6100.00, 407.05, true, '2025-10-24 19:13:58.471304');
INSERT INTO public.deductions VALUES ('ce453935-ab84-455b-ac7e-355d8f507408', '05dac079-069a-4b0d-a28b-81706f7478db', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 1470.00, 77.91, true, '2025-10-24 19:17:23.231807');
INSERT INTO public.deductions VALUES ('030032a8-9284-482b-adc9-0ef68aed34ca', '05dac079-069a-4b0d-a28b-81706f7478db', 'ALV', 'ALV Abzug', 1.1000, 1470.00, 16.17, true, '2025-10-24 19:17:23.231807');
INSERT INTO public.deductions VALUES ('d42f6020-2370-4d4a-bbbf-54c1015bd17d', '05dac079-069a-4b0d-a28b-81706f7478db', 'NBU', 'NBU/SUVA Abzug', 1.1680, 1470.00, 17.17, true, '2025-10-24 19:17:23.231807');
INSERT INTO public.deductions VALUES ('11c92335-6840-4536-971e-409f3b63cc22', '33a23499-0a9a-45b7-8bac-42aeeba5923b', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-24 19:18:32.997699');
INSERT INTO public.deductions VALUES ('aee1cd52-32bb-48cc-b961-1c69a9028ca3', '33a23499-0a9a-45b7-8bac-42aeeba5923b', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-24 19:18:32.997699');
INSERT INTO public.deductions VALUES ('25961226-aba5-4448-91af-1fa1a928df4d', '65c48ab5-ac60-4140-b4e0-180f3d9409fa', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6760.00, 358.28, true, '2025-10-24 19:38:51.91187');
INSERT INTO public.deductions VALUES ('9aa1346c-ecef-4587-96eb-6037eb5ad1cc', '65c48ab5-ac60-4140-b4e0-180f3d9409fa', 'ALV', 'ALV Abzug', 1.1000, 6760.00, 74.36, true, '2025-10-24 19:38:51.91187');
INSERT INTO public.deductions VALUES ('3910e5dc-5a42-4b6a-a52c-ffd581d741a3', '65c48ab5-ac60-4140-b4e0-180f3d9409fa', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6760.00, 78.96, true, '2025-10-24 19:38:51.91187');
INSERT INTO public.deductions VALUES ('c9b14526-8154-4e57-9a8c-db330315ce01', '65c48ab5-ac60-4140-b4e0-180f3d9409fa', 'BVG', 'BVG Abzug', NULL, 6760.00, 510.65, true, '2025-10-24 19:38:51.91187');
INSERT INTO public.deductions VALUES ('98e37116-b0d2-436c-814b-741bef55e149', '15053308-e416-447d-b856-a91b5b9935ff', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6100.00, 323.30, true, '2025-10-24 19:39:04.978156');
INSERT INTO public.deductions VALUES ('510d69d7-eca8-41c9-8b5b-1acf3fe00517', '15053308-e416-447d-b856-a91b5b9935ff', 'ALV', 'ALV Abzug', 1.1000, 6100.00, 67.10, true, '2025-10-24 19:39:04.978156');
INSERT INTO public.deductions VALUES ('0d404067-7acc-4950-90db-75b254a2c9a5', '15053308-e416-447d-b856-a91b5b9935ff', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6100.00, 71.25, true, '2025-10-24 19:39:04.978156');
INSERT INTO public.deductions VALUES ('3dd15e95-0c65-4b6f-94d6-69a8d21e4467', '15053308-e416-447d-b856-a91b5b9935ff', 'BVG', 'BVG Abzug', NULL, 6100.00, 407.05, true, '2025-10-24 19:39:04.978156');
INSERT INTO public.deductions VALUES ('fa1f9cab-155a-4659-babb-1355cef5859f', 'c9bfab3c-9357-4f8b-8fc1-992367be4be4', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 1780.00, 94.34, true, '2025-10-24 19:39:20.750822');
INSERT INTO public.deductions VALUES ('113bbdeb-9a3e-4c82-af6a-15565399e385', 'c9bfab3c-9357-4f8b-8fc1-992367be4be4', 'ALV', 'ALV Abzug', 1.1000, 1780.00, 19.58, true, '2025-10-24 19:39:20.750822');
INSERT INTO public.deductions VALUES ('f0367727-56e7-4f9b-9553-8d6df0828b7e', 'c9bfab3c-9357-4f8b-8fc1-992367be4be4', 'NBU', 'NBU/SUVA Abzug', 1.1680, 1780.00, 20.79, true, '2025-10-24 19:39:20.750822');
INSERT INTO public.deductions VALUES ('4afbb7b6-5a07-4fb7-bdcd-d1912d04c853', 'ab740373-1794-4384-a063-0354e3298242', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-24 19:39:36.291235');
INSERT INTO public.deductions VALUES ('a15155c8-0434-40fe-9369-201bb3f6c34a', 'ab740373-1794-4384-a063-0354e3298242', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-24 19:39:36.291235');
INSERT INTO public.deductions VALUES ('e77eb158-c6b9-4a85-b3e6-68e88d06bede', '2fba9dd2-f500-4ab0-9bd4-da87589cadc8', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-25 06:22:30.574242');
INSERT INTO public.deductions VALUES ('e97d8980-d9c5-4404-995c-e9df4ee51d9d', '2fba9dd2-f500-4ab0-9bd4-da87589cadc8', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-25 06:22:30.574242');
INSERT INTO public.deductions VALUES ('cabbe20c-d5fd-4140-b77f-29bcdff44a2d', 'edbf9083-f907-4ad3-9488-c6b0733ea966', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7450.00, 394.85, true, '2025-10-24 19:40:05.190952');
INSERT INTO public.deductions VALUES ('53a19e2f-00c3-4751-bc6b-c334cf0e4a78', 'edbf9083-f907-4ad3-9488-c6b0733ea966', 'ALV', 'ALV Abzug', 1.1000, 7450.00, 81.95, true, '2025-10-24 19:40:05.190952');
INSERT INTO public.deductions VALUES ('a7fd7349-c386-42c0-b32a-48b072094a6b', 'edbf9083-f907-4ad3-9488-c6b0733ea966', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7450.00, 87.02, true, '2025-10-24 19:40:05.190952');
INSERT INTO public.deductions VALUES ('68e17bcd-e12b-4c31-a248-521c71a5560c', 'edbf9083-f907-4ad3-9488-c6b0733ea966', 'BVG', 'BVG Abzug', NULL, 7450.00, 524.85, true, '2025-10-24 19:40:05.190952');
INSERT INTO public.deductions VALUES ('48a366f3-e61e-478d-b541-d2f8129ae423', '475e230c-343c-4ce9-b18b-04749b245563', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7385.00, 391.40, true, '2025-10-24 19:42:01.911758');
INSERT INTO public.deductions VALUES ('42feeb92-8445-4e47-a4dc-fb4275649191', '475e230c-343c-4ce9-b18b-04749b245563', 'ALV', 'ALV Abzug', 1.1000, 7385.00, 81.24, true, '2025-10-24 19:42:01.911758');
INSERT INTO public.deductions VALUES ('3543552e-b63b-47e5-92c6-ff061e036353', '475e230c-343c-4ce9-b18b-04749b245563', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7385.00, 86.26, true, '2025-10-24 19:42:01.911758');
INSERT INTO public.deductions VALUES ('a86fc1d4-cdf1-4a04-af89-6ad66a3189e3', '475e230c-343c-4ce9-b18b-04749b245563', 'BVG', 'BVG Abzug', NULL, 7385.00, 388.70, true, '2025-10-24 19:42:01.911758');
INSERT INTO public.deductions VALUES ('329a7553-30b0-440e-aba7-02ab22685ddb', 'dfd12cea-9017-4d88-a0c6-6d868b20235f', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 245.00, 12.98, true, '2025-10-24 19:42:26.147117');
INSERT INTO public.deductions VALUES ('c967cbff-2a3b-4fb9-9d70-3e25552dcf0a', 'dfd12cea-9017-4d88-a0c6-6d868b20235f', 'ALV', 'ALV Abzug', 1.1000, 245.00, 2.70, true, '2025-10-24 19:42:26.147117');
INSERT INTO public.deductions VALUES ('43230c3a-dcc7-400f-854e-639c24ab3985', 'dfd12cea-9017-4d88-a0c6-6d868b20235f', 'NBU', 'NBU/SUVA Abzug', 1.1680, 245.00, 2.86, true, '2025-10-24 19:42:26.147117');
INSERT INTO public.deductions VALUES ('178325b0-9e61-48a8-927f-f5271eb97a2b', 'd5cce845-d95c-4cb2-b0b9-91ef811650fb', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 245.00, 12.98, true, '2025-10-24 19:42:39.827591');
INSERT INTO public.deductions VALUES ('9b9c613e-2aab-44bc-a2e0-03d44e437b29', 'd5cce845-d95c-4cb2-b0b9-91ef811650fb', 'ALV', 'ALV Abzug', 1.1000, 245.00, 2.70, true, '2025-10-24 19:42:39.827591');
INSERT INTO public.deductions VALUES ('07f69e2a-5b56-46c0-90b5-863e9475df63', 'd5cce845-d95c-4cb2-b0b9-91ef811650fb', 'NBU', 'NBU/SUVA Abzug', 1.1680, 245.00, 2.86, true, '2025-10-24 19:42:39.827591');
INSERT INTO public.deductions VALUES ('a9590209-337b-40d1-9d0a-37c40bef7082', '8b796513-dc9e-4a4c-a187-d9141d1b72f8', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-24 19:42:51.981614');
INSERT INTO public.deductions VALUES ('c7e2e60c-294c-43b7-b3d5-45582fbb71f3', '8b796513-dc9e-4a4c-a187-d9141d1b72f8', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-24 19:42:51.981614');
INSERT INTO public.deductions VALUES ('3949004a-de37-4928-8a5b-f39033c2c98f', '8763d986-33f7-4aa4-9ad0-e7b35bfdcab4', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 8400.00, 445.20, true, '2025-10-24 19:43:08.034631');
INSERT INTO public.deductions VALUES ('bef2a62e-bfe1-4163-b63d-6a199dc0a8e6', '8763d986-33f7-4aa4-9ad0-e7b35bfdcab4', 'ALV', 'ALV Abzug', 1.1000, 8400.00, 92.40, true, '2025-10-24 19:43:08.034631');
INSERT INTO public.deductions VALUES ('924d3f3b-fd1b-4a5d-a5a1-d79c625e5c9e', '8763d986-33f7-4aa4-9ad0-e7b35bfdcab4', 'NBU', 'NBU/SUVA Abzug', 1.1680, 8400.00, 98.11, true, '2025-10-24 19:43:08.034631');
INSERT INTO public.deductions VALUES ('72562a23-aedd-4280-80e9-4b214fe57549', '8763d986-33f7-4aa4-9ad0-e7b35bfdcab4', 'BVG', 'BVG Abzug', NULL, 8400.00, 434.70, true, '2025-10-24 19:43:08.034631');
INSERT INTO public.deductions VALUES ('7d6cfb41-6d6b-4b35-9535-546a7f7f83ae', 'ac72687b-890c-4dab-a523-271d898f71c6', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 7150.00, 378.95, true, '2025-10-24 19:43:19.472583');
INSERT INTO public.deductions VALUES ('efe4dabc-859b-43e3-b833-2fedcc3ec9dc', 'ac72687b-890c-4dab-a523-271d898f71c6', 'ALV', 'ALV Abzug', 1.1000, 7150.00, 78.65, true, '2025-10-24 19:43:19.472583');
INSERT INTO public.deductions VALUES ('33922bf8-742e-4ea4-b1ec-47738ce5acc6', 'ac72687b-890c-4dab-a523-271d898f71c6', 'NBU', 'NBU/SUVA Abzug', 1.1680, 7150.00, 83.51, true, '2025-10-24 19:43:19.472583');
INSERT INTO public.deductions VALUES ('b5fa7a6d-28a3-4374-8c5f-aea2f4150aef', 'ac72687b-890c-4dab-a523-271d898f71c6', 'BVG', 'BVG Abzug', NULL, 7150.00, 581.75, true, '2025-10-24 19:43:19.472583');
INSERT INTO public.deductions VALUES ('753e6585-c252-4b6d-b4e8-da39dd475553', '54e54da0-72dd-46c3-887a-6efeb04e1d0a', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 6760.00, 358.28, true, '2025-10-25 06:28:29.200251');
INSERT INTO public.deductions VALUES ('f74653bf-c326-4951-8359-4a252d452cd6', '54e54da0-72dd-46c3-887a-6efeb04e1d0a', 'ALV', 'ALV Abzug', 1.1000, 6760.00, 74.36, true, '2025-10-25 06:28:29.200251');
INSERT INTO public.deductions VALUES ('63a9b859-b9aa-4789-a8b1-5d7056c845f2', '54e54da0-72dd-46c3-887a-6efeb04e1d0a', 'NBU', 'NBU/SUVA Abzug', 1.1680, 6760.00, 78.96, true, '2025-10-25 06:28:29.200251');
INSERT INTO public.deductions VALUES ('5c989a12-f852-497d-bc6b-2e15a88385a6', '54e54da0-72dd-46c3-887a-6efeb04e1d0a', 'BVG', 'BVG Abzug', NULL, 6760.00, 510.65, true, '2025-10-25 06:28:29.200251');
INSERT INTO public.deductions VALUES ('5aab0dd1-3f7e-4e75-a239-a43cd17e996b', 'ed2f294f-84d1-4b9c-867e-d247f53f680f', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 185.00, 9.80, true, '2025-10-25 06:31:03.725232');
INSERT INTO public.deductions VALUES ('40f2f979-ea51-46b1-b8c9-95f5c2f64449', 'ed2f294f-84d1-4b9c-867e-d247f53f680f', 'ALV', 'ALV Abzug', 1.1000, 185.00, 2.04, true, '2025-10-25 06:31:03.725232');
INSERT INTO public.deductions VALUES ('a60e3e97-b612-4c00-a9c3-866972c382ef', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 348.50, 18.47, true, '2025-10-27 16:03:54.873124');
INSERT INTO public.deductions VALUES ('f1f82e78-6155-4c9f-be21-f5505d2b235b', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', 'ALV', 'ALV Abzug', 1.1000, 348.50, 3.83, true, '2025-10-27 16:03:54.873124');
INSERT INTO public.deductions VALUES ('1293e3cd-66df-4266-8058-6ef5d0cd5d06', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', 'NBU', 'NBU/SUVA Abzug', 1.1680, 348.50, 4.07, true, '2025-10-27 16:03:54.873124');
INSERT INTO public.deductions VALUES ('a303e7c3-cc26-4886-bd60-e7a780027ac5', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', 'BVG', 'BVG Abzug', 4.3800, 348.50, 15.26, true, '2025-10-27 16:03:54.873124');
INSERT INTO public.deductions VALUES ('0d3113ad-df7f-46f6-bb58-766a76efc4bb', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', 'KTG GAV', 'KTG GAV Personalverleih', 1.5150, 348.50, 5.28, true, '2025-10-27 16:03:54.873124');
INSERT INTO public.deductions VALUES ('79401dd4-38eb-4d26-89b6-449ee8f10a5c', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', 'Berufsbeitrag GAV', 'Berufsbeitrag GAV Personalverleih', 0.4000, 348.50, 1.39, true, '2025-10-27 16:03:54.873124');
INSERT INTO public.deductions VALUES ('6c47822e-0e60-4720-92a5-68ba0ac794f2', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 227.71, 12.07, true, '2025-10-27 16:05:46.367932');
INSERT INTO public.deductions VALUES ('35cbb0ce-2d8d-4d44-bf06-7c60349acd3c', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', 'ALV', 'ALV Abzug', 1.1000, 227.71, 2.50, true, '2025-10-27 16:05:46.367932');
INSERT INTO public.deductions VALUES ('ed0a609c-49e1-4a3d-865c-839fff3994d5', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', 'NBU', 'NBU/SUVA Abzug', 1.1680, 227.71, 2.66, true, '2025-10-27 16:05:46.367932');
INSERT INTO public.deductions VALUES ('97860ee1-b7bc-470c-aab1-4dd19fa22d18', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', 'BVG', 'BVG Abzug', 4.3800, 227.71, 9.97, true, '2025-10-27 16:05:46.367932');
INSERT INTO public.deductions VALUES ('b0b2da17-d5e1-45e8-9e0b-b731dcf8d164', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', 'KTG GAV', 'KTG GAV Personalverleih', 1.5150, 227.71, 3.45, true, '2025-10-27 16:05:46.367932');
INSERT INTO public.deductions VALUES ('9cc5a37f-bd78-4c04-a4c6-51c8cd7a0aa1', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', 'Berufsbeitrag GAV', 'Berufsbeitrag GAV Personalverleih', 0.4000, 227.71, 0.91, true, '2025-10-27 16:05:46.367932');
INSERT INTO public.deductions VALUES ('6209867b-87b2-4efd-a6fb-35f088e0a77d', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', 'AHV', 'AHV/IV/EO Abzug', 5.3000, 230.51, 12.22, true, '2025-10-27 16:06:31.453786');
INSERT INTO public.deductions VALUES ('e1a83bca-3a8f-4e9a-a62e-0aa8fd8883dd', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', 'ALV', 'ALV Abzug', 1.1000, 230.51, 2.54, true, '2025-10-27 16:06:31.453786');
INSERT INTO public.deductions VALUES ('45c3e2c1-ae3a-42c5-b271-5f6fffaa7021', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', 'NBU', 'NBU/SUVA Abzug', 1.1680, 230.51, 2.69, true, '2025-10-27 16:06:31.453786');
INSERT INTO public.deductions VALUES ('d51188f0-7c0c-422c-b562-792ef4261da3', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', 'BVG', 'BVG Abzug', 4.3800, 230.51, 10.10, true, '2025-10-27 16:06:31.453786');
INSERT INTO public.deductions VALUES ('c82fe2cf-3889-4acf-aabf-25bc7fbfea10', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', 'KTG GAV', 'KTG GAV Personalverleih', 1.5150, 230.51, 3.49, true, '2025-10-27 16:06:31.453786');
INSERT INTO public.deductions VALUES ('db0bcff3-b0c8-428d-a452-3538cdeabb35', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', 'Berufsbeitrag GAV', 'Berufsbeitrag GAV Personalverleih', 0.4000, 230.51, 0.92, true, '2025-10-27 16:06:31.453786');


--
-- Data for Name: payroll_item_types; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payroll_item_types VALUES ('3d3932c4-641c-447f-b032-e21f7366def9', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '01', 'Monatslohn', true, true, true, true, true, true, 1, '2025-10-22 08:17:13.992875', '2025-10-22 08:17:13.992875');
INSERT INTO public.payroll_item_types VALUES ('2ee6066a-53b6-4786-80e0-b49c13f13933', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '02', 'Stundenlohn', true, true, true, true, true, true, 2, '2025-10-22 08:17:13.992875', '2025-10-22 08:17:13.992875');
INSERT INTO public.payroll_item_types VALUES ('d3947c0d-dd77-44cd-8003-76ced7256950', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '03', 'Überstundenzuschlag', true, true, true, true, true, true, 3, '2025-10-22 08:17:13.992875', '2025-10-22 08:17:13.992875');
INSERT INTO public.payroll_item_types VALUES ('2940e01c-4470-4721-957e-d84136df0ca3', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '04', '13. Monatslohn', true, true, true, true, true, true, 4, '2025-10-22 08:17:13.992875', '2025-10-22 08:17:13.992875');
INSERT INTO public.payroll_item_types VALUES ('f0790ddd-50fe-4295-9b96-9fb153c19297', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '05', 'Bonus', true, true, true, true, true, true, 5, '2025-10-22 08:17:13.992875', '2025-10-22 08:17:13.992875');
INSERT INTO public.payroll_item_types VALUES ('a34621a6-9c88-49c4-ae11-33b3762b0514', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '06', 'Zulagen', true, true, true, true, true, true, 6, '2025-10-22 08:17:13.992875', '2025-10-22 15:29:41.597');
INSERT INTO public.payroll_item_types VALUES ('4ae2c05a-7d27-4606-b664-2bd160e04a84', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '07', 'Feiertagsentschädigung', true, true, true, true, false, true, 7, '2025-10-22 08:17:13.992875', '2025-10-22 15:30:02.77');
INSERT INTO public.payroll_item_types VALUES ('2ad2d25b-3560-4400-b012-fd145ea97440', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '08', 'Kinderzulagen', false, false, false, false, false, true, 8, '2025-10-22 09:49:57.343363', '2025-10-22 15:30:19.682');
INSERT INTO public.payroll_item_types VALUES ('62395b16-2842-4c1e-8420-72943079852d', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '09', 'Korrektur ', true, true, true, true, true, true, 9, '2025-10-22 14:59:01.989943', '2025-10-22 15:30:31.255');
INSERT INTO public.payroll_item_types VALUES ('a578cc03-410b-4656-ae70-3cc4b7c76b2c', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '10', 'Mutterschaftsentschädigung', true, true, true, true, true, true, 10, '2025-10-22 15:00:06.46318', '2025-10-22 15:30:40.44');
INSERT INTO public.payroll_item_types VALUES ('8bf77191-3b62-484a-b606-137188002096', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '11', 'Spesen', false, false, false, false, false, true, 11, '2025-10-22 08:17:13.992875', '2025-10-22 15:30:50.482');
INSERT INTO public.payroll_item_types VALUES ('c72b087a-39a4-45d4-b4a1-3ceb16b85b9d', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '12', 'ALV Entschädigung', true, true, true, true, true, true, 12, '2025-10-22 15:00:39.912741', '2025-10-22 15:31:01.743');
INSERT INTO public.payroll_item_types VALUES ('3fd0204c-11d5-41a3-abc7-eec4be31c51a', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '13', 'Unfalltaggeld', true, true, true, true, true, true, 13, '2025-10-22 15:00:59.519617', '2025-10-22 15:31:25.209');
INSERT INTO public.payroll_item_types VALUES ('6648430e-45a0-4a11-bd51-891a0f4dce45', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '14', 'Ferien', true, true, true, true, true, true, 14, '2025-10-27 14:57:27.840976', '2025-10-27 14:57:27.840976');
INSERT INTO public.payroll_item_types VALUES ('5765c5fa-4529-4a0d-87ce-1a06ddcd43d2', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '16', 'Sonntags/Feiertags Zulage', true, true, true, true, true, true, 16, '2025-10-27 14:58:38.453408', '2025-10-27 14:58:38.453408');
INSERT INTO public.payroll_item_types VALUES ('fb8b9eec-5b5c-4f5e-aa5d-34e23cb3482b', 'fcaf8f2b-5927-43ee-9288-e198ac6331b7', '15', 'Abend/Nachtzulage', true, true, true, true, true, true, 15, '2025-10-27 14:58:07.682673', '2025-10-27 15:00:25.361');


--
-- Data for Name: payroll_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payroll_items VALUES ('3e7cf6fa-6a9b-4078-b4f1-5a39b4c4d6e3', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', '02', 'Lohn', 150.18, 4.50, 33.37, '2025-10-27 16:05:46.299448');
INSERT INTO public.payroll_items VALUES ('2bd544ee-3725-4755-9637-0e5918916e8e', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', '04', '13. Monatslohn', 12.51, 4.50, 2.78, '2025-10-27 16:05:46.299448');
INSERT INTO public.payroll_items VALUES ('634cd2be-df8f-4370-8b19-e449325036f6', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', '07', 'Ferienentschädigung', 4.81, 4.50, 1.07, '2025-10-27 16:05:46.299448');
INSERT INTO public.payroll_items VALUES ('59c74d36-ba37-467d-ac0b-de179f3c1c6b', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', '14', 'Ferien', 12.51, 4.50, 2.78, '2025-10-27 16:05:46.299448');
INSERT INTO public.payroll_items VALUES ('e0d9cfd8-a77f-4af3-9eca-65faabd59b4c', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', '15', 'Abend/Nachtzulage', 20.70, 3.45, 6.00, '2025-10-27 16:05:46.299448');
INSERT INTO public.payroll_items VALUES ('a7afc5b9-3978-41a9-8d24-f7b7e821dd49', '29d859eb-13d6-4b9c-8547-f036d41fb2ae', '16', 'Sonntags/Ferientagszulage', 27.00, 4.50, 6.00, '2025-10-27 16:05:46.299448');
INSERT INTO public.payroll_items VALUES ('86eb8d6a-44c5-40e0-920e-0b5b99d9d064', '14a2fb00-adc3-45d4-ade7-2c4e75841564', '01', NULL, 5500.00, NULL, NULL, '2025-10-22 09:17:14.311289');
INSERT INTO public.payroll_items VALUES ('e774712a-9972-4815-9b5d-99cbc634c69f', '14a2fb00-adc3-45d4-ade7-2c4e75841564', '09', '2 Kinder (200 CHF je Kind)', 450.00, NULL, NULL, '2025-10-22 09:17:14.311289');
INSERT INTO public.payroll_items VALUES ('94d110b9-4df5-49e5-9f23-6720dbf96625', 'ca1d48ac-09fb-4af6-a8a2-3a34f0403a21', '02', NULL, 210.00, 6.00, 35.00, '2025-10-23 07:23:09.505721');
INSERT INTO public.payroll_items VALUES ('885e391c-879c-4e75-9661-ef7f85df1907', 'f2778d65-f60a-4c7f-bcbc-bf2343c6caf0', '01', NULL, 6668.00, 8335.00, 80.00, '2025-10-23 07:24:58.774875');
INSERT INTO public.payroll_items VALUES ('871e1f4b-22e5-4bed-8077-eabacf8e0015', '158d139a-79c3-49d0-a06e-f1baf73d85c3', '01', NULL, 7300.00, 7300.00, 100.00, '2025-10-23 06:28:59.927222');
INSERT INTO public.payroll_items VALUES ('b1313207-ae6d-4b42-8445-e627668c88f9', '80a67758-08f6-48de-96ac-03ba6ec3de75', '01', NULL, 7385.00, 9231.25, 80.00, '2025-10-23 06:30:41.953485');
INSERT INTO public.payroll_items VALUES ('00d6b71e-a221-4104-a1b5-6ca56bc669ec', '3f4b2234-a67a-4bc1-8d79-5207c9980d69', '01', NULL, 5961.00, 5961.00, 100.00, '2025-10-23 07:25:12.621733');
INSERT INTO public.payroll_items VALUES ('9c675a4c-790e-4541-981d-72d7e8b798c3', '6facba06-e49d-470a-a3db-38385853de66', '01', NULL, 5000.00, NULL, NULL, '2025-10-21 20:21:36.232747');
INSERT INTO public.payroll_items VALUES ('4529e8ff-ba59-4390-9ee0-834aa47a540d', '3f4b2234-a67a-4bc1-8d79-5207c9980d69', '08', '2 Kinder', 430.00, NULL, NULL, '2025-10-23 07:25:12.621733');
INSERT INTO public.payroll_items VALUES ('941e251d-938d-40fd-bc3d-15e94f61d9b9', 'f5f7e642-8f4f-4ed5-aaa4-3c1bcd3516d1', '02', NULL, 780.00, 19.50, 40.00, '2025-10-23 07:25:31.232618');
INSERT INTO public.payroll_items VALUES ('165236d1-5704-4112-8654-984d7db386a4', '8f84c35f-f77d-418a-92b9-cc1e3cfb2519', '01', NULL, 6668.00, 8335.00, 80.00, '2025-10-22 19:22:00.987327');
INSERT INTO public.payroll_items VALUES ('f25d7688-980c-4a1a-ab90-3e976cb43124', '0a33fe8a-c6fa-4f3d-ba30-f3bd5a0cc7f9', '01', NULL, 5961.00, 5961.00, 100.00, '2025-10-23 06:20:20.66115');
INSERT INTO public.payroll_items VALUES ('1c20a398-e5f9-4176-baf3-9ca6b5207af0', '0a33fe8a-c6fa-4f3d-ba30-f3bd5a0cc7f9', '08', '2 Kinder', 430.00, NULL, NULL, '2025-10-23 06:20:20.66115');
INSERT INTO public.payroll_items VALUES ('58063794-18df-4ecd-9422-3ff38f64841c', '10850448-1f21-4c15-b950-2316c7a21661', '02', NULL, 583.20, 14.58, 40.00, '2025-10-23 06:25:56.786997');
INSERT INTO public.payroll_items VALUES ('330c94af-b00c-405b-998e-c0fdd9eaff69', '604cf41d-61ac-439e-a3b5-70d263102de2', '01', NULL, 12100.00, 12100.00, 100.00, '2025-10-23 06:27:44.567339');
INSERT INTO public.payroll_items VALUES ('f951e377-73ff-4dbf-bb6e-9c207fe6bb89', '2acf929b-f040-45f1-aeba-d1260b57cdc7', '01', NULL, 8300.00, 8300.00, 100.00, '2025-10-23 06:32:48.873481');
INSERT INTO public.payroll_items VALUES ('079ac57f-10d0-44eb-adc4-609613108b7a', 'e374f8ab-3bcb-4675-916e-617dfd985dd9', '01', NULL, 7150.00, 11000.00, 65.00, '2025-10-23 06:33:38.64962');
INSERT INTO public.payroll_items VALUES ('b0242c77-a9b9-449d-a9e8-efbc0cc8ddb1', '7410c8f2-47ba-4333-8eb1-e88db52723c8', '11', NULL, 400.00, NULL, NULL, '2025-10-23 07:29:40.720068');
INSERT INTO public.payroll_items VALUES ('baadff24-a783-4819-9fb4-ae87acb753d3', '7410c8f2-47ba-4333-8eb1-e88db52723c8', '01', NULL, 185.00, 185.00, 100.00, '2025-10-23 07:29:40.720068');
INSERT INTO public.payroll_items VALUES ('cca37179-f047-4938-b014-02021e100d5e', '1496d668-7134-48c6-974d-6f0259d6b296', '01', NULL, 12100.00, 12100.00, 100.00, '2025-10-23 07:30:28.907867');
INSERT INTO public.payroll_items VALUES ('3d3e801b-3527-406c-93fb-75a6700f3e2d', '58d7548f-6730-48b9-b838-609ebebca0d0', '01', NULL, 7300.00, 7300.00, 100.00, '2025-10-23 07:30:42.556854');
INSERT INTO public.payroll_items VALUES ('21564f4c-896d-4e79-80dd-0872615e579b', '41c6c9c6-cb6c-4072-a3a4-3ca4c3d056f4', '01', NULL, 7385.00, 9231.25, 80.00, '2025-10-23 07:31:00.164912');
INSERT INTO public.payroll_items VALUES ('fed4c20d-8ae4-4340-b580-a3ec80af27a2', 'f0d2289b-e3e4-4e46-8202-30bb43d3faec', '11', NULL, 400.00, NULL, NULL, '2025-10-23 07:58:30.450518');
INSERT INTO public.payroll_items VALUES ('38aaafdd-7ed5-44eb-8545-a5c3e7ad24c9', 'f0d2289b-e3e4-4e46-8202-30bb43d3faec', '01', NULL, 185.00, 185.00, 100.00, '2025-10-23 07:58:30.450518');
INSERT INTO public.payroll_items VALUES ('62026b9f-54a4-4403-8707-9e4f45d54f13', '3e861e79-ec2b-4452-b087-2f1626600930', '01', NULL, 8300.00, 8300.00, 100.00, '2025-10-23 07:59:33.337426');
INSERT INTO public.payroll_items VALUES ('eb55cf0e-931e-4ced-8568-5345ea88ab00', 'b2f98e90-2f6e-4814-8689-0a33b665cbcd', '01', NULL, 7150.00, 11000.00, 65.00, '2025-10-23 07:59:47.399514');
INSERT INTO public.payroll_items VALUES ('a5bb2096-33d3-4b56-9df2-cbac1ed5110c', '8178b4a4-0549-4889-9fea-c9d5a81fc674', '02', NULL, 350.00, 10.00, 35.00, '2025-10-23 18:10:42.216043');
INSERT INTO public.payroll_items VALUES ('5cb7b4c9-5d64-4626-879e-45387420a4bc', '235cfd93-bfc6-4377-8de3-fbc840cdd1ea', '01', NULL, 6760.00, 8450.00, 80.00, '2025-10-23 18:55:00.854499');
INSERT INTO public.payroll_items VALUES ('d2744488-00b3-4e51-a7bf-fa13932c614e', '235cfd93-bfc6-4377-8de3-fbc840cdd1ea', '05', NULL, 2000.00, 2000.00, 100.00, '2025-10-23 18:55:00.854499');
INSERT INTO public.payroll_items VALUES ('ef9ed2af-753d-484d-b0b6-3baaaa462761', '12739a89-a58e-4b8d-ad56-88c16aa418b7', '01', NULL, 6100.00, 6100.00, 100.00, '2025-10-23 18:55:19.999513');
INSERT INTO public.payroll_items VALUES ('a09449a9-7013-46c4-9c63-a7d92bf613ef', '12739a89-a58e-4b8d-ad56-88c16aa418b7', '05', NULL, 1500.00, 1500.00, 100.00, '2025-10-23 18:55:19.999513');
INSERT INTO public.payroll_items VALUES ('b0afa65e-d103-4ca1-8a57-d84233af6efc', '12739a89-a58e-4b8d-ad56-88c16aa418b7', '08', '2 Kinder', 430.00, NULL, NULL, '2025-10-23 18:55:19.999513');
INSERT INTO public.payroll_items VALUES ('2f8d1770-1ea1-48b1-868a-f0f3cd9b807e', 'c029a1b9-4167-403a-90c7-104fe0b0917f', '02', NULL, 340.00, 8.50, 40.00, '2025-10-23 18:55:59.802558');
INSERT INTO public.payroll_items VALUES ('e64e2de4-79e8-4efb-8cb1-9c67570ef28d', '696e7051-0499-4d62-a1ec-0e3a285afa78', '11', NULL, 400.00, NULL, NULL, '2025-10-23 18:56:24.440581');
INSERT INTO public.payroll_items VALUES ('aafca108-25b0-40a1-9d99-d45073c4f4ba', '696e7051-0499-4d62-a1ec-0e3a285afa78', '01', NULL, 185.00, 185.00, 100.00, '2025-10-23 18:56:24.440581');
INSERT INTO public.payroll_items VALUES ('86cdb05a-9793-48e6-a10c-bbff5dae8996', 'f023734e-8cdf-4e4f-9be2-a2bc69296dd7', '01', NULL, 7450.00, 7450.00, 100.00, '2025-10-23 18:59:55.320282');
INSERT INTO public.payroll_items VALUES ('891bd99d-9a68-47f0-8219-d1ada63b3db7', 'f023734e-8cdf-4e4f-9be2-a2bc69296dd7', '05', NULL, 3000.00, 3000.00, 100.00, '2025-10-23 18:59:55.320282');
INSERT INTO public.payroll_items VALUES ('5c7e85d0-1100-420c-99ab-677dade1e402', 'b08b3556-85de-4469-b8ca-1fa2a0b4db66', '01', NULL, 7385.00, 9231.25, 80.00, '2025-10-23 19:00:26.979027');
INSERT INTO public.payroll_items VALUES ('e56df96c-66b3-4f37-afea-ddeb778e8fd2', 'b08b3556-85de-4469-b8ca-1fa2a0b4db66', '05', NULL, 1500.00, 1500.00, 100.00, '2025-10-23 19:00:26.979027');
INSERT INTO public.payroll_items VALUES ('08a2e46f-e151-4413-b069-6288905923b1', 'c876c17a-cbce-42b4-984e-f156a7cf6a34', '02', NULL, 245.00, 7.00, 35.00, '2025-10-23 19:00:49.591194');
INSERT INTO public.payroll_items VALUES ('e3958efe-caeb-4ec5-8542-e8ce949649fc', '2c1e2384-37d2-460d-9cfb-f53f3523a088', '02', NULL, 245.00, 7.00, 35.00, '2025-10-23 19:00:59.668304');
INSERT INTO public.payroll_items VALUES ('7790346b-aa64-4eed-95fd-4e2a9bdd0c2f', '8c152fbc-9ca1-42a2-8d0b-fbacfb29c5f1', '02', NULL, 392.00, 14.00, 28.00, '2025-10-23 19:01:23.961723');
INSERT INTO public.payroll_items VALUES ('6250b8aa-5569-4550-bcdb-6320c6f22ac4', '06a73ccc-cd23-47e0-904c-1a668d573c1d', '11', NULL, 400.00, NULL, NULL, '2025-10-23 19:01:40.958382');
INSERT INTO public.payroll_items VALUES ('01e4fe91-4637-4c9d-90d5-6917a4d3f527', '06a73ccc-cd23-47e0-904c-1a668d573c1d', '01', NULL, 185.00, 185.00, 100.00, '2025-10-23 19:01:40.958382');
INSERT INTO public.payroll_items VALUES ('58b94860-fa92-42d8-a6da-f3ad3304674d', '46cadb07-c540-413b-ace4-975e0af7d46d', '01', NULL, 8400.00, 8400.00, 100.00, '2025-10-23 19:01:58.516725');
INSERT INTO public.payroll_items VALUES ('10cf4b9b-19ca-4972-be96-bbc307e15c4c', '46cadb07-c540-413b-ace4-975e0af7d46d', '05', NULL, 2000.00, 2000.00, 100.00, '2025-10-23 19:01:58.516725');
INSERT INTO public.payroll_items VALUES ('62f31c4a-94cb-4e81-aa30-d9920ef2e4c8', 'a16d7773-756e-4d42-bbc4-6637779bd3ab', '01', NULL, 7150.00, 11000.00, 65.00, '2025-10-23 19:02:25.431182');
INSERT INTO public.payroll_items VALUES ('945272e6-d71b-460f-acde-6713cc711219', 'a16d7773-756e-4d42-bbc4-6637779bd3ab', '05', NULL, 12000.00, 12000.00, 100.00, '2025-10-23 19:02:25.431182');
INSERT INTO public.payroll_items VALUES ('5feaba4a-5fa1-4032-8b58-96aab711af90', '4c53bca3-05a1-4fb6-84d3-a9d3c8c86500', '01', '', 12100.00, 7450.00, 100.00, '2025-10-24 11:40:09.308093');
INSERT INTO public.payroll_items VALUES ('62762d02-c52a-4a1c-a551-348cd6b84ec0', '0018475c-fdfc-49c0-a84e-7856ee3a8c9e', '01', '', 12100.00, 12100.00, 100.00, '2025-10-24 11:42:23.719389');
INSERT INTO public.payroll_items VALUES ('7de422d2-1155-4c94-84ba-21d07e4599f4', '0018475c-fdfc-49c0-a84e-7856ee3a8c9e', '05', '', 18000.00, NULL, NULL, '2025-10-24 11:42:23.719389');
INSERT INTO public.payroll_items VALUES ('e38db541-2432-4415-96dc-d7c44d4549ec', 'b8e8a246-0548-4957-9427-dadc5b7d3490', '01', NULL, 6760.00, 8450.00, 80.00, '2025-10-24 13:55:30.184661');
INSERT INTO public.payroll_items VALUES ('2fcb0f2d-6e4c-4243-88f3-c2a226d7c2d5', 'f6c9b0e1-dea1-4c83-ae70-86536a433962', '01', NULL, 6100.00, 6100.00, 100.00, '2025-10-24 13:56:03.377736');
INSERT INTO public.payroll_items VALUES ('df5dd354-1e29-49eb-8db7-8ead0d23837d', 'f6c9b0e1-dea1-4c83-ae70-86536a433962', '08', '2 Kinder', 430.00, NULL, NULL, '2025-10-24 13:56:03.377736');
INSERT INTO public.payroll_items VALUES ('c1cbeb00-6212-45f2-aa86-a7ccd0e00a62', 'c9800081-ebbd-4da0-bb06-532b5f1a9ebd', '01', NULL, 12100.00, 12100.00, 100.00, '2025-10-23 19:54:28.640032');
INSERT INTO public.payroll_items VALUES ('3f913d62-dd82-4350-84db-8dd23bd5cc4b', 'f4df5e5a-cde7-4c58-adc1-9d21e30afcb4', '02', NULL, 280.00, 7.00, 40.00, '2025-10-24 13:56:19.127039');
INSERT INTO public.payroll_items VALUES ('35bf81ce-9d3c-48ba-bbd1-21f7fe177566', 'f3479479-30e5-492b-aed3-b2e54e606dea', '11', NULL, 400.00, NULL, NULL, '2025-10-24 13:56:35.61407');
INSERT INTO public.payroll_items VALUES ('5136eb14-380f-4dda-8664-25f3bb27c141', 'f3479479-30e5-492b-aed3-b2e54e606dea', '01', NULL, 185.00, 185.00, 100.00, '2025-10-24 13:56:35.61407');
INSERT INTO public.payroll_items VALUES ('a857266f-7703-4605-9a87-3551b3e6252b', '3646b36d-9b29-4903-8fce-e12a03ec9306', '01', NULL, 7450.00, 7450.00, 100.00, '2025-10-24 13:58:22.569762');
INSERT INTO public.payroll_items VALUES ('494aa3f2-6229-4cf1-bd64-d30d0284e05f', '0860cb21-5b46-4911-8b6e-b5afd6d87e26', '01', NULL, 7385.00, 9231.25, 80.00, '2025-10-24 13:58:38.017681');
INSERT INTO public.payroll_items VALUES ('2083741a-28ec-42cf-93f6-10a1cc286f2a', 'c67cf0b6-e8ba-4582-8af2-a1390b76a777', '02', NULL, 245.00, 7.00, 35.00, '2025-10-24 13:58:59.16155');
INSERT INTO public.payroll_items VALUES ('dc4bdd7d-e5a1-4052-9eb6-547f2af2bff6', '09b1ab7a-7ff7-481f-b033-2a65b14bd8b1', '02', NULL, 245.00, 7.00, 35.00, '2025-10-24 13:59:09.987772');
INSERT INTO public.payroll_items VALUES ('f7a666c8-5260-443e-92fe-c75fafba5c6f', '240413f1-1b0a-4bb4-9b91-f96791a4ebd8', '02', NULL, 392.00, 14.00, 28.00, '2025-10-24 13:59:32.886078');
INSERT INTO public.payroll_items VALUES ('d3625344-2ea2-4285-84b5-566e995ea332', 'c1ae8ce6-cc1e-42f1-b9a7-c5c0857dd504', '11', NULL, 400.00, NULL, NULL, '2025-10-24 13:59:45.646437');
INSERT INTO public.payroll_items VALUES ('af025903-8fbd-4ada-be5a-c62872e2b7c7', 'c1ae8ce6-cc1e-42f1-b9a7-c5c0857dd504', '01', NULL, 185.00, 185.00, 100.00, '2025-10-24 13:59:45.646437');
INSERT INTO public.payroll_items VALUES ('b91c5f06-1bd9-4068-9976-310995e7b419', '02f60db0-1049-4d4a-a086-0a55bf8c6c02', '01', NULL, 8400.00, 8400.00, 100.00, '2025-10-24 13:59:56.880968');
INSERT INTO public.payroll_items VALUES ('eb4a1b8e-de2a-4c86-a754-1f1e3220ea09', '3b71fc8f-c799-480f-915c-1db8da91f55d', '01', NULL, 7150.00, 11000.00, 65.00, '2025-10-24 14:00:07.5645');
INSERT INTO public.payroll_items VALUES ('726aa314-1333-4721-b97f-891b89736073', 'e345bd6b-7b19-4f34-a269-f65bc97e2f70', '01', NULL, 6760.00, 8450.00, 80.00, '2025-10-24 14:08:34.068307');
INSERT INTO public.payroll_items VALUES ('247270f3-1699-462d-b203-3ef9a7884c2d', '42ee7e40-253d-460b-9268-07937fafc38a', '01', NULL, 6100.00, 6100.00, 100.00, '2025-10-24 14:08:42.958385');
INSERT INTO public.payroll_items VALUES ('da7d57aa-1844-4427-957f-79dc6e5747df', '42ee7e40-253d-460b-9268-07937fafc38a', '08', '2 Kinder', 430.00, NULL, NULL, '2025-10-24 14:08:42.958385');
INSERT INTO public.payroll_items VALUES ('09b2311b-912d-4e4b-a6e2-bfe7e331d72c', 'b947086a-1e59-4502-88da-ff12ef128331', '02', NULL, 950.00, 23.75, 40.00, '2025-10-24 14:08:55.278879');
INSERT INTO public.payroll_items VALUES ('e595cdc8-5079-4b15-85a1-81e0b13cb32a', '75e9c271-4c6f-4a6e-bc81-8ed25cbe8b19', '11', NULL, 400.00, NULL, NULL, '2025-10-24 14:09:08.89173');
INSERT INTO public.payroll_items VALUES ('a9d9d574-aa45-49eb-87eb-dfd1717e582f', '75e9c271-4c6f-4a6e-bc81-8ed25cbe8b19', '01', NULL, 185.00, 185.00, 100.00, '2025-10-24 14:09:08.89173');
INSERT INTO public.payroll_items VALUES ('5796f1da-b8a6-4969-95ad-cfeba9aebde5', '0686ccfd-2d18-4a14-a485-c8aec811450d', '01', NULL, 7450.00, 7450.00, 100.00, '2025-10-24 14:10:23.474095');
INSERT INTO public.payroll_items VALUES ('0aa90370-ca67-44f9-b8c4-a462ac4df65a', '4291b0e6-0f92-4ef7-9501-4e23d125bed8', '02', NULL, 350.00, 10.00, 35.00, '2025-10-24 09:22:19.194029');
INSERT INTO public.payroll_items VALUES ('92091f29-57c6-4872-b995-8099e2c04ebe', 'e7354a6f-b518-460c-9d86-b5cd97247c6a', '02', NULL, 392.00, 14.00, 28.00, '2025-10-24 09:25:50.34015');
INSERT INTO public.payroll_items VALUES ('038fe0da-5d64-42bb-89e9-8636b27a09c0', '4a19245d-cded-4261-9eed-bd1c0ef39789', '01', NULL, 7385.00, 9231.25, 80.00, '2025-10-24 14:10:38.787777');
INSERT INTO public.payroll_items VALUES ('fc3ee1e2-afe8-4704-90f2-5db70c27ebbc', '8837d1da-bf86-4e51-8248-1bf0849353e6', '02', NULL, 437.50, 12.50, 35.00, '2025-10-24 14:11:01.860182');
INSERT INTO public.payroll_items VALUES ('8e6cfb20-9ae1-4d6e-832a-5565962ee04a', 'fdc160eb-4033-4b59-8480-f58107172ba2', '02', NULL, 437.50, 12.50, 35.00, '2025-10-24 14:11:14.281146');
INSERT INTO public.payroll_items VALUES ('ae389f36-4637-4196-b643-25cd2e4cbd5f', '390e74c3-0645-4a5d-b0d8-2983f8f06ddf', '02', NULL, 392.00, 14.00, 28.00, '2025-10-24 14:11:43.255754');
INSERT INTO public.payroll_items VALUES ('e1ccda97-4811-46bd-a897-30ba72ffc083', '3933a5c8-67dc-455f-81a3-e053916b8a77', '11', NULL, 400.00, NULL, NULL, '2025-10-24 14:11:54.878351');
INSERT INTO public.payroll_items VALUES ('aac8acd1-2f33-4b8d-bcd0-cffe211c4bdf', '3933a5c8-67dc-455f-81a3-e053916b8a77', '01', NULL, 185.00, 185.00, 100.00, '2025-10-24 14:11:54.878351');
INSERT INTO public.payroll_items VALUES ('aa2b8b21-2969-4eb9-8a49-dbd78b3e4549', '1a12b6eb-5317-4247-a222-9ffebc35282c', '01', NULL, 8400.00, 8400.00, 100.00, '2025-10-24 14:12:08.629145');
INSERT INTO public.payroll_items VALUES ('ad2faeeb-759a-4ef6-b7ae-ab8a48aff638', '5a129ebc-3cdb-4f7e-a2db-3c294c0121f8', '01', NULL, 7150.00, 11000.00, 65.00, '2025-10-24 14:12:18.084067');
INSERT INTO public.payroll_items VALUES ('0d3c8114-8228-4d82-9b83-d9c6d99aec84', '648f345d-1cea-4933-b6a1-5f98f69fa805', '01', '', 12100.00, 12100.00, 100.00, '2025-10-24 15:20:25.108653');
INSERT INTO public.payroll_items VALUES ('2f88f83b-1046-4ae2-9294-1e1dd796751e', 'e427fdc9-c18f-48d0-9fd8-007567dfd11f', '01', NULL, 12100.00, 12100.00, 100.00, '2025-10-24 15:29:42.911772');
INSERT INTO public.payroll_items VALUES ('c61b5ac3-682e-4ca1-a5ae-795b3ebc6c3c', 'eb545dd1-5fca-4c98-b476-ee39af8d97dc', '01', NULL, 6760.00, 8450.00, 80.00, '2025-10-24 16:35:56.302945');
INSERT INTO public.payroll_items VALUES ('097f00f1-38ea-4f23-844d-5c607a0cd289', 'f92ff264-e35e-4847-b10f-ffc185969658', '01', NULL, 6100.00, 6100.00, 100.00, '2025-10-24 16:36:03.660416');
INSERT INTO public.payroll_items VALUES ('0dd44a02-7336-4d4d-bf3c-2db2c52261d0', 'f92ff264-e35e-4847-b10f-ffc185969658', '08', '2 Kinder', 430.00, NULL, NULL, '2025-10-24 16:36:03.660416');
INSERT INTO public.payroll_items VALUES ('73abbc7b-1aa2-4434-b2eb-a19cb04f886e', '37aafcd2-69c7-4d12-aa39-2dc346a5ddfd', '02', NULL, 500.00, 12.50, 40.00, '2025-10-24 16:36:32.157158');
INSERT INTO public.payroll_items VALUES ('8e289365-f003-4712-80a6-107076c21c11', 'a27f83e7-f85c-4f19-8af0-de82e7603ffe', '02', 'Lohn', 147.00, 3.50, 42.00, '2025-10-26 21:27:23.07327');
INSERT INTO public.payroll_items VALUES ('d7417aa2-fc5a-448a-ad79-973b391495ce', 'a27f83e7-f85c-4f19-8af0-de82e7603ffe', '06', 'Sonntagszulage', 19.60, 3.27, 6.00, '2025-10-26 21:27:23.07327');
INSERT INTO public.payroll_items VALUES ('ac9dbc02-fa54-4626-b7d5-6c39dd73f38b', 'b59ff4da-d0f2-4ef4-be63-978359f01477', '01', NULL, 12100.00, 12100.00, 100.00, '2025-10-24 16:51:17.969296');
INSERT INTO public.payroll_items VALUES ('c956b3e8-a139-403d-b21f-577d5cf30f7f', 'bae209f8-8315-476c-9b87-74800d87301e', '01', NULL, 7450.00, 7450.00, 100.00, '2025-10-24 16:51:47.265314');
INSERT INTO public.payroll_items VALUES ('1062ab34-b7a6-4211-b957-c054cdf8a4e5', 'd42296ea-ae6b-4758-af6a-18ddc4413843', '01', NULL, 7385.00, 9231.25, 80.00, '2025-10-24 16:51:59.672821');
INSERT INTO public.payroll_items VALUES ('444eeb9d-dc87-49b9-bca5-8425f4f2ff3e', '02c7e1fb-8197-4629-863c-d7f4ef173909', '02', NULL, 245.00, 7.00, 35.00, '2025-10-24 16:52:28.68341');
INSERT INTO public.payroll_items VALUES ('9ea3af33-a53b-4fa5-b571-93f13dbbd85f', 'd5d8276e-1784-4fbe-9cb2-5c07399a834a', '02', NULL, 245.00, 7.00, 35.00, '2025-10-24 16:52:41.441148');
INSERT INTO public.payroll_items VALUES ('541814ba-a956-4dd3-ae8f-0292e91ceecf', '9149bc93-6bf1-406f-a281-b44878b2ff4f', '02', NULL, 392.00, 14.00, 28.00, '2025-10-24 16:54:01.98591');
INSERT INTO public.payroll_items VALUES ('93a1aeac-f462-486b-a5bb-36076b85fb56', '32f45d66-e402-45ca-a7dd-ff9a95bc6785', '11', NULL, 400.00, NULL, NULL, '2025-10-24 16:56:11.262634');
INSERT INTO public.payroll_items VALUES ('5930c78f-16ac-462b-814b-913036afc189', '32f45d66-e402-45ca-a7dd-ff9a95bc6785', '01', NULL, 185.00, 185.00, 100.00, '2025-10-24 16:56:11.262634');
INSERT INTO public.payroll_items VALUES ('6bcc0824-b969-4ee2-8f25-015ad2423fdb', '7f606abf-06a2-41ab-b072-9a2586114246', '01', NULL, 8400.00, 8400.00, 100.00, '2025-10-24 16:56:22.990853');
INSERT INTO public.payroll_items VALUES ('937ec1a4-9e70-4d9e-9ce9-1ba2946d9a3a', 'c17cf0d1-2cc5-47b3-8ea4-7a9682b5bebb', '01', NULL, 7150.00, 11000.00, 65.00, '2025-10-24 16:56:32.686864');
INSERT INTO public.payroll_items VALUES ('6536a298-1b76-49c6-be0d-7f59d9e417d8', '78058e9e-36c2-473a-ac0a-cdecfd29043b', '01', NULL, 12100.00, 12100.00, 100.00, '2025-10-24 16:57:07.445036');
INSERT INTO public.payroll_items VALUES ('67152e9a-1b73-4204-bdf1-394a4ee44972', '7353d0c5-bc59-4e9e-8aa8-178b63c22823', '01', NULL, 6760.00, 8450.00, 80.00, '2025-10-24 17:17:35.922085');
INSERT INTO public.payroll_items VALUES ('e88cbbc3-5fc5-4615-ac8e-0fed0a80e54e', '48cf7161-9b35-4cbd-bc64-4738ae6979eb', '11', NULL, 400.00, NULL, NULL, '2025-10-24 17:34:37.803648');
INSERT INTO public.payroll_items VALUES ('73a0df28-7fb7-441e-9edf-e5d40c4cd414', '48cf7161-9b35-4cbd-bc64-4738ae6979eb', '01', NULL, 185.00, 185.00, 100.00, '2025-10-24 17:34:37.803648');
INSERT INTO public.payroll_items VALUES ('e84d73c1-cd78-4178-92a1-eba79ea881aa', '8cf78e3f-b561-47d4-9601-3194ce8f9d03', '01', NULL, 7450.00, 7450.00, 100.00, '2025-10-24 19:06:37.393892');
INSERT INTO public.payroll_items VALUES ('6b3e51fa-2fb1-48b8-818e-e3b266010207', 'c47ae371-fb0e-4edc-9494-8a2564fe3fd5', '01', NULL, 7385.00, 9231.25, 80.00, '2025-10-24 19:06:47.380439');
INSERT INTO public.payroll_items VALUES ('bb27f600-77f2-47d0-91a3-3bd8f90e2dd3', '5dcf2d2a-40ec-482f-9297-758d5724c148', '02', NULL, 332.50, 9.50, 35.00, '2025-10-24 19:07:06.61672');
INSERT INTO public.payroll_items VALUES ('5a31b1c7-fc43-4f3e-869e-794e3a29c90c', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', '02', 'Lohn', 150.18, 4.50, 33.37, '2025-10-27 16:06:31.380698');
INSERT INTO public.payroll_items VALUES ('f33efa12-fb55-4778-9182-161e2ea8b730', '38b4ae58-e6b5-477d-abb7-ee270a33d936', '02', NULL, 332.50, 9.50, 35.00, '2025-10-24 19:07:55.405217');
INSERT INTO public.payroll_items VALUES ('23bf23ae-d022-4760-ad4a-8c3c14ea6b5a', '140b86bd-11ee-4a72-a45e-0459c82206a9', '11', NULL, 400.00, NULL, NULL, '2025-10-24 19:08:05.226945');
INSERT INTO public.payroll_items VALUES ('839cdaac-629a-4adc-afbb-c1beffc048e5', '140b86bd-11ee-4a72-a45e-0459c82206a9', '01', NULL, 185.00, 185.00, 100.00, '2025-10-24 19:08:05.226945');
INSERT INTO public.payroll_items VALUES ('00128f03-fb15-46d5-a4ed-d80c4ba9c6a5', '87ad95d8-0add-426d-a7f0-9ad266865cba', '01', NULL, 8400.00, 8400.00, 100.00, '2025-10-24 19:08:16.045863');
INSERT INTO public.payroll_items VALUES ('2b94a1ff-4956-4215-9f0c-cfc19ef12dfd', 'bcb0eb1a-1a38-4e7f-83eb-0c5475c978a5', '01', NULL, 7150.00, 11000.00, 65.00, '2025-10-24 19:08:25.50674');
INSERT INTO public.payroll_items VALUES ('707f1dc7-0cf1-4bec-85c0-574be82eb798', 'f0c58438-75fe-4491-918d-56211af3f89a', '01', NULL, 10000.00, 10000.00, 100.00, '2025-10-24 19:10:59.587206');
INSERT INTO public.payroll_items VALUES ('1d6a3a18-927d-41d1-919b-e8cfa3714aa8', 'cbdce295-2f42-4b76-b3c1-c48319f14c83', '01', 'Grundgehalt September', 6100.00, NULL, NULL, '2025-10-24 19:13:58.405473');
INSERT INTO public.payroll_items VALUES ('84191f55-8699-4552-9b0c-de1163045ed7', 'cbdce295-2f42-4b76-b3c1-c48319f14c83', '08', NULL, 430.00, 2.00, 215.00, '2025-10-24 19:13:58.405473');
INSERT INTO public.payroll_items VALUES ('64560066-1313-4c7e-89e1-974da0248e37', '05dac079-069a-4b0d-a28b-81706f7478db', '02', NULL, 1470.00, 36.75, 40.00, '2025-10-24 19:17:23.162594');
INSERT INTO public.payroll_items VALUES ('37522e7d-f3be-4471-a1c1-611d120d449f', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', '04', '13. Monatslohn', 12.51, 4.50, 2.78, '2025-10-27 16:06:31.380698');
INSERT INTO public.payroll_items VALUES ('7dd41e80-8852-450d-8e80-ba5557480c33', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', '07', 'Ferienentschädigung', 4.81, 4.50, 1.07, '2025-10-27 16:06:31.380698');
INSERT INTO public.payroll_items VALUES ('609b37c1-09b6-47ba-8e89-9bbcddf034ab', '33a23499-0a9a-45b7-8bac-42aeeba5923b', '11', NULL, 400.00, NULL, NULL, '2025-10-24 19:18:32.928094');
INSERT INTO public.payroll_items VALUES ('f9a35401-ff92-47e7-a9d3-49ec37490476', '33a23499-0a9a-45b7-8bac-42aeeba5923b', '01', NULL, 185.00, 185.00, 100.00, '2025-10-24 19:18:32.928094');
INSERT INTO public.payroll_items VALUES ('68d4ad08-62e9-458f-bc1b-6b8e72b55316', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', '14', 'Ferien', 12.51, 4.50, 2.78, '2025-10-27 16:06:31.380698');
INSERT INTO public.payroll_items VALUES ('3d39a66b-b791-4b30-904a-aa6fa2524ba9', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', '15', 'Abend/Nachtzulage', 23.50, 3.92, 6.00, '2025-10-27 16:06:31.380698');
INSERT INTO public.payroll_items VALUES ('6c39f31b-00df-4c8e-add0-a8b803791161', '65c48ab5-ac60-4140-b4e0-180f3d9409fa', '01', NULL, 6760.00, 8450.00, 80.00, '2025-10-24 19:38:51.830764');
INSERT INTO public.payroll_items VALUES ('ed3d2b40-ad61-4ff8-a572-7d875cac0681', '15053308-e416-447d-b856-a91b5b9935ff', '01', NULL, 6100.00, 6100.00, 100.00, '2025-10-24 19:39:04.904621');
INSERT INTO public.payroll_items VALUES ('9f146d1f-51cb-4c1f-acc9-e3360e8eccce', '15053308-e416-447d-b856-a91b5b9935ff', '08', '2 Kinder', 430.00, NULL, NULL, '2025-10-24 19:39:04.904621');
INSERT INTO public.payroll_items VALUES ('8bad671d-be95-4a44-b42c-ccb868cd1bb0', 'c9bfab3c-9357-4f8b-8fc1-992367be4be4', '02', NULL, 1780.00, 44.50, 40.00, '2025-10-24 19:39:20.684249');
INSERT INTO public.payroll_items VALUES ('e8fa8193-b542-4ae3-85a6-6cc28fbe3ff4', 'ab740373-1794-4384-a063-0354e3298242', '11', NULL, 400.00, NULL, NULL, '2025-10-24 19:39:36.225011');
INSERT INTO public.payroll_items VALUES ('965c4493-b00f-4368-819e-ffbc4730b84b', 'ab740373-1794-4384-a063-0354e3298242', '01', NULL, 185.00, 185.00, 100.00, '2025-10-24 19:39:36.225011');
INSERT INTO public.payroll_items VALUES ('8a979466-166f-450c-837d-2f37ecdbd0a1', 'edbf9083-f907-4ad3-9488-c6b0733ea966', '01', NULL, 7450.00, 7450.00, 100.00, '2025-10-24 19:40:05.117665');
INSERT INTO public.payroll_items VALUES ('9dfdb108-d066-4655-bafc-a7bb38f091dd', '475e230c-343c-4ce9-b18b-04749b245563', '01', NULL, 7385.00, 9231.25, 80.00, '2025-10-24 19:42:01.843444');
INSERT INTO public.payroll_items VALUES ('da89b32a-fdad-44a0-99eb-045e9943ac63', 'dfd12cea-9017-4d88-a0c6-6d868b20235f', '02', NULL, 245.00, 7.00, 35.00, '2025-10-24 19:42:26.08052');
INSERT INTO public.payroll_items VALUES ('7a8412b3-68b1-4562-8ed7-023b3bb1877f', 'd5cce845-d95c-4cb2-b0b9-91ef811650fb', '02', NULL, 245.00, 7.00, 35.00, '2025-10-24 19:42:39.755654');
INSERT INTO public.payroll_items VALUES ('70a18e0a-4fe6-4b2e-824c-172e8baf51e7', '8b796513-dc9e-4a4c-a187-d9141d1b72f8', '11', NULL, 400.00, NULL, NULL, '2025-10-24 19:42:51.914837');
INSERT INTO public.payroll_items VALUES ('273582fe-f616-42d1-99c3-0456eb624185', '8b796513-dc9e-4a4c-a187-d9141d1b72f8', '01', NULL, 185.00, 185.00, 100.00, '2025-10-24 19:42:51.914837');
INSERT INTO public.payroll_items VALUES ('f299baea-b6e0-4551-b8f7-97697b5885c0', '8763d986-33f7-4aa4-9ad0-e7b35bfdcab4', '01', NULL, 8400.00, 8400.00, 100.00, '2025-10-24 19:43:07.967941');
INSERT INTO public.payroll_items VALUES ('78620ee2-d8b9-42ab-8d99-106288ceea76', 'ac72687b-890c-4dab-a523-271d898f71c6', '01', NULL, 7150.00, 11000.00, 65.00, '2025-10-24 19:43:19.40085');
INSERT INTO public.payroll_items VALUES ('fd31e7c7-7bef-4955-be78-1d8d3798cc72', 'bb108261-5be2-4c43-9fd5-09924c68af69', '01', NULL, 12100.00, 12100.00, 100.00, '2025-10-24 21:21:01.873162');
INSERT INTO public.payroll_items VALUES ('410c75e2-3481-4049-8623-5240e7951ae9', 'eaabc451-ea95-4b28-be40-d823e40c9f62', '01', NULL, 7385.00, 9231.25, 80.00, '2025-10-25 06:21:33.23236');
INSERT INTO public.payroll_items VALUES ('9a748789-aa18-4f0f-bfe7-e785cb4eb30b', '2fba9dd2-f500-4ab0-9bd4-da87589cadc8', '11', NULL, 400.00, NULL, NULL, '2025-10-25 06:22:30.504478');
INSERT INTO public.payroll_items VALUES ('544c72da-1284-4745-ba37-c5530cb1961d', '2fba9dd2-f500-4ab0-9bd4-da87589cadc8', '01', NULL, 185.00, 185.00, 100.00, '2025-10-25 06:22:30.504478');
INSERT INTO public.payroll_items VALUES ('540e89e3-6dbd-4edc-b140-37c0f47b6047', '54080893-ad3f-4958-b6cb-2bcefadbbf37', '01', NULL, 8400.00, 8400.00, 100.00, '2025-10-25 06:22:42.726611');
INSERT INTO public.payroll_items VALUES ('aeb7e905-73c1-4957-9c24-c3fc9f895b7d', '29bc390b-a16b-472e-b9c5-74ed994306fe', '02', NULL, 105.00, 3.00, 35.00, '2025-10-25 06:24:24.018412');
INSERT INTO public.payroll_items VALUES ('7bbb0016-0e99-45be-a939-2cc6e3fe03d3', '33b3ec03-d668-43a3-9494-5cc5a9e843c5', '02', NULL, 105.00, 3.00, 35.00, '2025-10-25 06:24:56.95784');
INSERT INTO public.payroll_items VALUES ('081ab178-dabb-43ae-b303-73ee7527c170', '530af5f6-0624-43b5-89e6-a244f6679347', '01', NULL, 7450.00, 7450.00, 100.00, '2025-10-25 06:26:42.546657');
INSERT INTO public.payroll_items VALUES ('218c2dcd-1f91-4897-a614-04e72e5ffa26', '54e54da0-72dd-46c3-887a-6efeb04e1d0a', '01', NULL, 6760.00, 8450.00, 80.00, '2025-10-25 06:28:29.134106');
INSERT INTO public.payroll_items VALUES ('dfed7180-8d11-42f9-8f8e-8a23dfc7775c', '1c1386f3-39f0-4217-bc5a-b81e7e93d170', '01', NULL, 6100.00, 6100.00, 100.00, '2025-10-25 06:28:41.346142');
INSERT INTO public.payroll_items VALUES ('9027a9c4-fc02-4b2d-85db-a084f59d07f0', '1c1386f3-39f0-4217-bc5a-b81e7e93d170', '08', '2 Kinder', 430.00, NULL, NULL, '2025-10-25 06:28:41.346142');
INSERT INTO public.payroll_items VALUES ('df5bdacf-b685-469f-9ab7-48404bf7a604', 'd5b0f70a-321d-4917-811f-e1d172c74201', '02', NULL, 392.00, 14.00, 28.00, '2025-10-25 06:29:40.795832');
INSERT INTO public.payroll_items VALUES ('d368d9c7-8958-41e9-acba-98ede52eef49', '2b43321d-6233-416a-8f5a-d71f1e12635e', '02', NULL, 320.00, 8.00, 40.00, '2025-10-25 06:30:48.727721');
INSERT INTO public.payroll_items VALUES ('0b78c186-1831-42c7-9f8d-9e3686bc1728', 'ed2f294f-84d1-4b9c-867e-d247f53f680f', '11', NULL, 400.00, NULL, NULL, '2025-10-25 06:31:03.658598');
INSERT INTO public.payroll_items VALUES ('bb8d652e-e559-4148-ab2b-15ed2dbd9e2e', 'ed2f294f-84d1-4b9c-867e-d247f53f680f', '01', NULL, 185.00, 185.00, 100.00, '2025-10-25 06:31:03.658598');
INSERT INTO public.payroll_items VALUES ('4fe851c2-918c-412f-a274-3f9007fc6ae4', '64fb118b-22bb-4372-9e9f-20eb662b4529', '01', NULL, 12100.00, 12100.00, 100.00, '2025-10-25 06:35:21.18752');
INSERT INTO public.payroll_items VALUES ('bf03fbd4-15f6-42a9-8797-6df5c745805f', '082e9d81-5db7-493e-8134-dd26a12536a9', '01', NULL, 10000.00, 10000.00, 100.00, '2025-10-25 06:49:36.287011');
INSERT INTO public.payroll_items VALUES ('b08a2a46-5e55-4f57-b955-cfff91602cd2', '082e9d81-5db7-493e-8134-dd26a12536a9', '08', '2 Kinderzulagen + 2 Sept', 1072.00, 4.00, 268.00, '2025-10-25 06:49:36.287011');
INSERT INTO public.payroll_items VALUES ('aecd8714-beb0-47ed-941d-edb99b16952f', '6925a954-b56c-4837-b99a-8edfd3548a51', '01', NULL, 400000.00, 400000.00, 100.00, '2025-10-25 07:25:20.22266');
INSERT INTO public.payroll_items VALUES ('627e944a-1ecd-406c-a1aa-0ed52a1682de', 'e8d5bd65-58a0-44e9-846d-665694b07427', '2ad2d25b-3560-4400-b012-fd145ea97440', NULL, 600.00, NULL, NULL, '2025-10-26 07:34:21.861988');
INSERT INTO public.payroll_items VALUES ('0914a0cb-a190-4256-b652-7a82eb6c2784', 'f5f4a0b7-812b-4023-b734-d08e423ad4dc', '2ad2d25b-3560-4400-b012-fd145ea97440', NULL, 600.00, NULL, NULL, '2025-10-26 07:34:22.120265');
INSERT INTO public.payroll_items VALUES ('41623cbc-4fc0-43df-a618-17d776915775', '6bb88fb7-79cb-4aef-8f8d-9daeee5268c4', '2ad2d25b-3560-4400-b012-fd145ea97440', NULL, 600.00, NULL, NULL, '2025-10-26 07:34:22.375667');
INSERT INTO public.payroll_items VALUES ('363a58e1-82ab-4e77-b003-3dc707457d54', 'b7cf170a-833b-4b96-aae6-81085f6b15f7', '2ad2d25b-3560-4400-b012-fd145ea97440', NULL, 600.00, NULL, NULL, '2025-10-26 07:34:22.630596');
INSERT INTO public.payroll_items VALUES ('5f46682d-61c0-4b01-8a4c-ae62eda56b30', '27695b25-e40b-4bf2-9d04-7f562f3e1359', '01', NULL, 7150.00, 11000.00, 65.00, '2025-10-26 12:10:44.696933');
INSERT INTO public.payroll_items VALUES ('67ab021d-6e68-45cc-97d9-11b82135b40d', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', '02', 'Lohn', 276.57, 8.50, 32.54, '2025-10-27 16:03:54.798743');
INSERT INTO public.payroll_items VALUES ('c413ab02-13ba-4739-a487-3226f652444c', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', '04', '13. Monatslohn', 23.04, 8.50, 2.71, '2025-10-27 16:03:54.798743');
INSERT INTO public.payroll_items VALUES ('73bd04e9-d1ce-45cc-823b-863875903fb3', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', '07', 'Ferienentschädigung', 8.85, 8.50, 1.04, '2025-10-27 16:03:54.798743');
INSERT INTO public.payroll_items VALUES ('1b6bcb0b-902b-40fd-a50f-20f5d4db8d3e', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', '14', 'Ferien', 23.04, 8.50, 2.71, '2025-10-27 16:03:54.798743');
INSERT INTO public.payroll_items VALUES ('98968934-82f0-4126-a5a2-14e6e0a04e13', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', '15', 'Abend/Nachtzulage', 8.50, 1.42, 6.00, '2025-10-27 16:03:54.798743');
INSERT INTO public.payroll_items VALUES ('289a0b1e-be1c-47d1-a1ca-1006528efeaf', '782e0c96-6eb9-42ef-a51b-3c07f1d43bad', '16', 'Sonntags/Ferientagszulage', 8.50, 1.42, 6.00, '2025-10-27 16:03:54.798743');
INSERT INTO public.payroll_items VALUES ('5c52037a-4b2c-4ab3-a27f-3b6647efc3dd', 'f63ea30f-d178-46b5-b49a-7d7bb056e117', '16', 'Sonntags/Ferientagszulage', 27.00, 4.50, 6.00, '2025-10-27 16:06:31.380698');


--
-- Data for Name: payroll_templates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payroll_templates VALUES ('1eb815c5-986f-46ec-9482-5a86a1b1f963', 'Test Vorlage', '', '[{"type":"Monatslohn","amount":"5000"}]', '[{"type":"AHV","percentage":"5.3"}]', '2025-10-21 19:01:03.528776', '2025-10-21 19:01:03.528776');


--
-- PostgreSQL database dump complete
--

