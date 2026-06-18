// src/context/DataContext.jsx
import { createContext, useContext, useRef, useEffect, useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'

const DataContext = createContext(null)

const getKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`

export function DataProvider({ children }) {
    const cache = useRef({})
    const { fetchTransactions } = useTransactions()
    const { fetchCategories } = useCategories()
    const [categories, setCategories] = useState([])
    const [loadingCategories, setLoadingCategories] = useState(true)

    useEffect(() => {
        fetchCategories().then(({ data }) => {
        if (data) setCategories(data)
        setLoadingCategories(false)
        })
    }, [])

    async function getTransactionsForMonth(year, month) {
        const key = getKey(year, month)
        if (cache.current[key]) return cache.current[key]
        const { data, error } = await fetchTransactions({ year, month })
        if (!error) cache.current[key] = data
        return data
    }

    async function reloadCategories() {
        const { data } = await fetchCategories()
        if (data) setCategories(data)
    }

    function invalidateMonth(year, month) {
        delete cache.current[getKey(year, month)]
    }

    function updateTransactionInCache(year, month, transaction) {
        const key = getKey(year, month)
        if (cache.current[key]) {
            cache.current[key] = cache.current[key].map(t => t.id === transaction.id ? transaction : t)
        }
    }

    return (
        <DataContext.Provider value={{
        getTransactionsForMonth,
        invalidateMonth,
        updateTransactionInCache,
        categories,
        loadingCategories,
        reloadCategories,
        }}>
        {children}
        </DataContext.Provider>
    )
}

export function useData() {
    return useContext(DataContext)
}